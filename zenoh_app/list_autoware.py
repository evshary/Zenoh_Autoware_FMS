import zenoh
import json

def list_autoware(session, use_bridge_ros2dds=True, search_times=10):
    ### uuid --> scope, address
    agent_infos = {}

    ### Retrive scope from admin space of zenoh-bridge-dds
    for _ in range(search_times):
        if use_bridge_ros2dds:
            replies = session.get('@ros2/**/config', zenoh.Queue())
        else:
            replies = session.get('@/service/**/config', zenoh.Queue())
        for reply in replies.receiver:
            try:
                key_expr_ = str(reply.ok.key_expr)
                payload_ = json.loads(reply.ok.payload.decode("utf-8"))

                if use_bridge_ros2dds:
                    uuid = key_expr_.split('/')[1].lower()
                    # Need to remove /
                    scope = payload_['namespace'][1:]
                else:
                    uuid = key_expr_.split('/')[2].lower()
                    scope = payload_['scope']

                if uuid not in agent_infos.keys():
                    agent_infos[uuid] = {}
                agent_infos[uuid]['scope'] = scope
            except:
                pass

        ### Retrive ip from admin space of zenoh-bridge-dds
        replies = session.get('@/session/**/link/**', zenoh.Queue())
        for reply in replies.receiver:
            try:
                key_expr_ = str(reply.ok.key_expr)
                payload_ = json.loads(reply.ok.payload.decode("utf-8"))

                uuid = key_expr_.split('/')[5].lower()
                address = payload_['dst']

                if uuid in agent_infos.keys():
                    agent_infos[uuid]['address'] = address
            except:
                pass
    
    return list(agent_infos.values())