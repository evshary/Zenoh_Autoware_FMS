import os
import time

import zenoh
from lanelet2.core import BasicPoint3d, GPSPoint
from lanelet2.io import Origin
from lanelet2.projection import UtmProjector
from zenoh_ros_type.autoware_adapi_msgs import ChangeOperationMode, Route, VehicleKinematics
from zenoh_ros_type.common_interfaces import (
    Point,
    Pose,
    PoseStamped,
    Quaternion,
)
from zenoh_ros_type.common_interfaces.std_msgs import Header
from zenoh_ros_type.rcl_interfaces import Time
from zenoh_ros_type.tier4_autoware_msgs import GateMode

from .map_parser import OrientationParser

GET_POSE_KEY_EXPR = '/api/vehicle/kinematics'
GET_GOAL_POSE_KEY_EXPR = '/api/routing/route'
SET_AUTO_MODE_KEY_EXPR = '/api/operation_mode/change_to_autonomous'

### TODO: Should be replaced by ADAPI
SET_GOAL_KEY_EXPR = '/planning/mission_planning/goal'
SET_GATE_MODE_KEY_EXPR = '/control/gate_mode_cmd'


class VehiclePose:
    def __init__(self, session, scope, use_bridge_ros2dds=True):
        ### Information
        self.use_bridge_ros2dds = use_bridge_ros2dds
        self.session = session
        self.scope = scope
        self.originX = float(os.environ['REACT_APP_MAP_ORIGIN_LAT'])
        self.originY = float(os.environ['REACT_APP_MAP_ORIGIN_LON'])
        self.projector = UtmProjector(Origin(self.originX, self.originY))
        self.initialize()

    def initialize(self):
        self.lat = 0.0
        self.lon = 0.0

        self.positionX = 0.0
        self.positionY = 0.0

        self.topic_prefix = self.scope if self.use_bridge_ros2dds else self.scope + '/rt'

        self.orientationGen = OrientationParser()

        self.goalX = 0.0
        self.goalY = 0.0
        self.goalLat = 0.0
        self.goalLon = 0.0
        self.goalValid = False

        def callback_position(sample):
            print('Got message of kinematics of vehicle')
            # print("size of the message (bytes) ", struct.calcsize(sample.payload))
            # print(sample.payload)
            data = VehicleKinematics.deserialize(sample.payload.deserialize(bytes))
            # print(data)
            self.positionX = data.pose.pose.pose.position.x
            self.positionY = data.pose.pose.pose.position.y
            gps = self.projector.reverse(BasicPoint3d(self.positionX, self.positionY, 0.0))
            self.lat = gps.lat
            self.lon = gps.lon

        def callback_goalPosition(sample):
            print('Got message of route of vehicle')
            data = Route.deserialize(sample.payload.deserialize(bytes))
            if len(data.data) == 1: 
                self.goalX = data.data[0].goal.position.x
                self.goalY = data.data[0].goal.position.y
                gps = self.projector.reverse(BasicPoint3d(self.goalX, self.goalY, 0.0))
                self.goalLat = gps.lat
                self.goalLon = gps.lon
                print("Echo back goal pose: ", self.goalLat, self.goalLon)
                self.goalValid = True

        ### Topics
        ###### Subscribers
        self.subscriber_pose = self.session.declare_subscriber(self.topic_prefix + GET_POSE_KEY_EXPR, callback_position)
        self.subscriber_goalPose = self.session.declare_subscriber(self.topic_prefix + GET_GOAL_POSE_KEY_EXPR, callback_goalPosition)

        ###### Publishers
        self.publisher_gate_mode = self.session.declare_publisher(self.topic_prefix + SET_GATE_MODE_KEY_EXPR)
        self.publisher_goal = self.session.declare_publisher(self.topic_prefix + SET_GOAL_KEY_EXPR)

    def setGoal(self, lat, lon):
        coordinate = self.projector.forward(GPSPoint(float(lat), float(lon), 0))
        q = self.orientationGen.genQuaternion_seg(coordinate.x, coordinate.y)
        self.publisher_goal.put(
            PoseStamped(
                header=Header(stamp=Time(sec=0, nanosec=0), frame_id='map'),
                pose=Pose(position=Point(x=coordinate.x, y=coordinate.y, z=0), orientation=Quaternion(x=q[0], y=q[1], z=q[2], w=q[3])),
            ).serialize()
        )

    def engage(self):
        self.publisher_gate_mode.put(GateMode(data=GateMode.DATA['AUTO'].value).serialize())

        # Ensure Autoware receives the gate mode change before the operation mode change
        time.sleep(1)

        replies = self.session.get(self.topic_prefix + SET_AUTO_MODE_KEY_EXPR)
        for reply in replies:
            # TODO: Handle service payload deserialize error
            print(f"Received data (bytes): {reply.ok.payload.deserialize(bytes)}")
            payload = reply.ok.payload.deserialize(bytes)[-4:]+reply.ok.payload.deserialize(bytes)[:-4]
            print(f"Modified payload (bytes): {payload}")

            try:
                # print(">> Received ('{}': {})".format(reply.ok.key_expr, ChangeOperationMode.deserialize(reply.ok.payload.deserialize(bytes))))
                print(">> Received ('{}': {})".format(reply.ok.key_expr, ChangeOperationMode.deserialize(payload)))
            except:
                print(">> Received (ERROR: '{}')".format(reply.err.payload.deserialize(bytes)))
                raise


class PoseServer:
    def __init__(self, session, use_bridge_ros2dds=False):
        self.use_bridge_ros2dds = use_bridge_ros2dds
        self.session = session
        self.vehicles = {}

    def findVehicles(self, time=10):
        for scope, vehicle in self.vehicles.items():
            vehicle.subscriber_pose.undeclare()

        self.vehicles = {}
        for _ in range(time):
            replies = self.session.get('@/**/ros2/**' + GET_POSE_KEY_EXPR)
            for reply in replies:
                key_expr = str(reply.ok.key_expr)
                if 'pub' in key_expr:
                    end = key_expr.find(GET_POSE_KEY_EXPR)
                    vehicle = key_expr[:end].split('/')[-1]
                    print(f'find vehicle {vehicle}')
                    self.vehicles[vehicle] = None
        self.constructVehicle()

    def constructVehicle(self):
        for scope in self.vehicles.keys():
            self.vehicles[scope] = VehiclePose(self.session, scope)

    def returnPose(self):
        poseInfo = []
        for scope, vehicle in self.vehicles.items():
            poseInfo.append({'name': scope, 'lat': vehicle.lat, 'lon': vehicle.lon})
        return poseInfo

    def returnGoalPose(self):
        goalPoseInfo = []
        for scope, vehicle in self.vehicles.items():
            if vehicle.goalValid:
                goalPoseInfo.append({'name': scope, 'lat': vehicle.goalLat, 'lon': vehicle.goalLon})
        return goalPoseInfo

    def setGoal(self, scope, lat, lon):
        if scope in self.vehicles.keys():
            self.vehicles[scope].setGoal(lat, lon)

    def engage(self, scope):
        if scope in self.vehicles.keys():
            self.vehicles[scope].engage()


if __name__ == '__main__':
    session = zenoh.open()
    mc = PoseServer(session, 'v1')
    
    while True:
        time.sleep(1)
