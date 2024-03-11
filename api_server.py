from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from zenoh_app.list_autoware import list_autoware
from zenoh_app.status_autoware import *
from zenoh_app.teleop_autoware import *
from zenoh_app.camera_autoware import MJPEG_server
from zenoh_app.pose_service import PoseServer
import zenoh
import math
import websockets
import cv2
import asyncio

MJPEG_HOST="0.0.0.0"
MJPEG_PORT=5000

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]
)

conf = zenoh.Config.from_file('config.json5')
session = zenoh.open(conf)
use_bridge_ros2dds = False
manual_controller = None
mjpeg_server = None
pose_service = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/list")
async def manage_list_autoware():
    return list_autoware(session, use_bridge_ros2dds)

@app.get("/status/{scope}")
async def manage_status_autoware(scope):
    return {
        "cpu": get_cpu_status(session, scope, use_bridge_ros2dds),
        "vehicle": get_vehicle_status(session, scope, use_bridge_ros2dds)
    }

@app.websocket("/video")
async def handle_ws(websocket: WebSocket):
    await websocket.accept()
    global mjpeg_server

    try:
        while True:
            if mjpeg_server is None or mjpeg_server.camera_image is None:
                await asyncio.sleep(2)
            else:
                # Encode the frame as JPEG
                _, buffer = cv2.imencode('.jpg', mjpeg_server.camera_image)
                frame_bytes = buffer.tobytes()
                await websocket.send_bytes(frame_bytes)
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        await websocket.close()


@app.get("/teleop/startup")
async def manage_teleop_startup(scope):
    global manual_controller, mjpeg_server, mjpeg_server_thread
    if manual_controller is not None:
        manual_controller.stop_teleop()
    manual_controller = ManualController(session, scope, use_bridge_ros2dds)

    if mjpeg_server is not None:
        mjpeg_server.change_scope(scope)
    else:
        mjpeg_server = MJPEG_server(session, scope, use_bridge_ros2dds)
        # mjpeg_server_thread = threading.Thread(target = mjpeg_server.run)
        # mjpeg_server_thread.start()
    return {
        "text": f"Startup manual control on {scope}.",
        "mjpeg_host": "localhost" if MJPEG_HOST == "0.0.0.0" else MJPEG_HOST,
        "mjpeg_port": MJPEG_PORT
    }

@app.get("/teleop/gear")
async def manage_teleop_gear(scope, gear):
    global manual_controller
    if manual_controller is not None:
        manual_controller.pub_gear(gear)
        return f"Set gear {gear} to {scope}."
    else:
        return "Please startup the teleop first"

@app.get("/teleop/velocity")
async def manage_teleop_speed(scope, velocity):
    global manual_controller
    if manual_controller is not None:
        manual_controller.update_control_command(float(velocity) * 1000 / 3600, None)
        return f"Set speed {velocity} to {scope}."
    else:
        return "Please startup the teleop first"

@app.get("/teleop/turn")
async def manage_teleop_turn(scope, angle):
    global manual_controller
    if manual_controller is not None:
        manual_controller.update_control_command(None, float(angle) * math.pi / 180)
        return f"Set steering angle {angle}."
    else:
        return "Please startup the teleop first"


@app.get("/teleop/status")
async def manage_teleop_status():
    global manual_controller
    if manual_controller is not None:
        return {
            'velocity': round(manual_controller.current_velocity * 3600 / 1000, 2),
            'gear': manual_controller.current_gear,
            'steering': manual_controller.current_steer * 180 / math.pi
        }
    else:
        return {
            'velocity': '---',
            'gear': '---',
            'steering': '---'
        }


@app.get("/map/startup")
async def manage_map_startup(scope):
    global pose_service
    if pose_service is  None:
        pose_service = PoseServer(session, scope)
    else:
        pose_service.change_scope(scope)

    return {
        "text": f"Startup manual control on {scope}."
    }

@app.get("/map/pose")
async def get_vehicle_pose():
    global pose_service
    if pose_service is not None:
        return {
            'lat': pose_service.lat,
            'lon': pose_service.lon,
            'startup': True
        }
    else:
        return {
            'lat': 0.0,
            'lon': 0.0,
            'startup': False
        }

@app.get("/map/setGoal")
async def set_goal_pose(scope, lat, lon):
    global pose_service
    if pose_service is not None:
        if scope != pose_service.scope:
            pose_service.change_scope(scope)
        print(f'[API SERVER] Set Goal Pose of {scope} as (lat={lat}, lon={lon})')
        pose_service.setGoal(lat, lon)
        return 'success'
    else:
        return 'fail'

@app.get("/map/engage")
async def set_goal_pose(scope):
    global pose_service
    if pose_service is not None:
        if scope != pose_service.scope:
            pose_service.change_scope(scope)
        pose_service.engage()
        return 'success'
    else:
        return 'fail'
