import zenoh
import json
import time
import sys
from .structure import *
from pycdr2 import Dict
from threading import Thread, Event

GET_STATUS_KEY_EXPR = '/rt/api/external/get/vehicle/status'
SET_GATE_MODE_KEY_EXPR = '/rt/control/gate_mode_cmd'
SET_ENGAGE_KEY_EXPR = '/rq/api/autoware/set/engageRequest'
SET_GEAR_KEY_EXPR = '/rt/api/external/set/command/remote/shift'
SET_TURN_KEY_EXPR = '/rt/api/external/set/command/remote/turn_signal'
SET_CONTROL_KEY_EXPR = '/rt/external/selected/control_cmd'
SET_PEDAL_CONTROL_KEY_EXPR = '/rt/api/external/set/command/remote/control'

class ManualController():
    def __init__(self, session, scope):
        ### Information
        self.session = session
        self.scope = scope

        self.end_event = Event()

        self.current_velocity = 0
        self.current_gear = 'NONE'
        self.current_steer = 0

        self.target_velocity = 0
        self.target_angle = 0

        def callback_status(sample):
            data = vehicle_status.deserialize(sample.payload)
            self.current_velocity = data.status.twist.linear.x
            gear_val = data.status.gear_shift.data
            self.current_gear = GearShift.GEAR(gear_val).name
            self.current_steer = data.status.steering.data
            # print(f'Gear: {self.current_gear} | velocity: {self.current_velocity * 3600 / 1000}')

        ### Subscribers
        self.subscriber_status = self.session.declare_subscriber(scope + GET_STATUS_KEY_EXPR, callback_status)

        ### Publishers
        self.publisher_gate_mode = self.session.declare_publisher(scope + SET_GATE_MODE_KEY_EXPR)
        self.publisher_engage = self.session.declare_publisher(scope + SET_ENGAGE_KEY_EXPR)
        self.publisher_gear = self.session.declare_publisher(scope + SET_GEAR_KEY_EXPR)
        self.publisher_turn = self.session.declare_publisher(scope + SET_TURN_KEY_EXPR)
        self.publisher_control = self.session.declare_publisher(scope + SET_CONTROL_KEY_EXPR)
        self.publisher_pedal = self.session.declare_publisher(scope + SET_PEDAL_CONTROL_KEY_EXPR)

        ### Control command
        self.control_command = AckermannControlCommand(
            stamp=Time(
                sec=0,
                nanosec=0
            ),
            lateral=AckermannLateralCommand(
                stamp=Time(
                    sec=0,
                    nanosec=0
                ),
                steering_tire_angle=0,
                steering_tire_rotation_rate=0
            ),
            longitudinal=LongitudinalCommand(
                stamp=Time(
                    sec=0,
                    nanosec=0
                ),
                speed=0,
                acceleration=0,
                jerk=0
            )
        )

        ### Startup external control
        self.publisher_gate_mode.put(
            GateMode(
                data=1
            ).serialize()
        )

        self.publisher_engage.put(
            EngageReq(
                header=ServiceHeader(
                    guid=0,
                    seq=0
                ),
                engage=True
            ).serialize()
        )

        ### Create new thread to send control command
        self.thread = Thread(target=self.pub_control)
        self.thread.start()

    def stop_teleop(self):
        self.update_control_command(0, 0)
        self.end_event.set()
        self.thread.join()

    def pub_gear(self, gear):
        gear_val = GearShift.GEAR[gear.upper()].value
        self.publisher_gear.put(
            GearShiftStamped(
                stamp=Time(
                    sec=0,
                    nanosec=0
                ),
                gear_shift=GearShift(
                    data=gear_val
                )
            ).serialize()
        )

    def update_control_command(self, velocity, angle):
        if velocity is not None:
            self.target_velocity = velocity
        if angle is not None:
            self.target_angle = angle

    def pub_control(self):
        while not self.end_event.is_set():
            ### Considering gear with velocity
            if self.current_gear.upper() == 'REVERSE':
                real_target_speed = self.target_velocity * (-1)
            else:
                real_target_speed = self.target_velocity

            ### Calculate acceleration
            acceleration = self.target_velocity - abs(self.current_velocity)
            if acceleration > 1.0:
                acceleration = 1.0
            elif acceleration < -1.0:
                acceleration = -1.0

            ### Steering angle
            self.control_command.lateral.steering_tire_angle = self.target_angle

            ### Pub control
            self.control_command.longitudinal.speed = self.target_velocity
            self.control_command.longitudinal.acceleration = acceleration
            self.control_command.stamp.nanosec += 1
            self.publisher_control.put(self.control_command.serialize())

            ### Set interval
            time.sleep(0.33)


if __name__ == "__main__":
    session = zenoh.open()
    mc = ManualController(session, 'v1')

    while True:
        c = input()
        if c == 'gear':
            gear = input()
            mc.pub_gear(gear)
        elif c == 'speed':
            speed = input()
            mc.update_control_command(float(speed))
        elif c == 'new':
            mc.stop_teleop()
            mc = ManualController(session, 'v1')
        else:
            mc.stop_teleop()
            break