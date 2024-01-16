import { useEffect, useState, useRef, forwardRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../../components/Cards/TitleCard"
import  MapViewer  from "./mapViewer"
import { Refresh } from "../vehiclelist"
import { selectVehicle } from "./mapViewSlice"
import axios from 'axios'

const VehicleSelect = forwardRef((props, ref) => {
    return (
        <select ref={ref} className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            <option value="None">None</option>
            {
                props.state.map((element, idx) => {
                    var V = JSON.parse(element)
                    return (<option key={V.name} value={V.name}>{V.name}</option>)
                })
            }
        </select>
    )
})


const VehicleSelectButton = (props) => {
    const dispatch = useDispatch()
    if(props.isLoading){
        return (
            <div className="inline-block float-right">
                <button className="btn px-6 btn-sm normal-case btn-primary">
                    <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        )
    }
    return(
        <button 
            className="btn px-6 btn-sm normal-case btn-info" 
            onClick={() => {dispatch(selectVehicle((props.refon.current)?(props.refon.current.value):"None"))}}>{props.text}</button>
    )
}

function MapPanel() {
    const {list} = useSelector(state => state.list)
    const scopeRef = useRef(null);
    const refreshLoadinig = useSelector(state => state.list.isLoading)
    const mapLoading = useSelector(state => state.mapview.isLoading)
    const mapScope = useSelector(state => state.mapview.scope)
    const [vehiclePose, setVehiclePose] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0,
            valid: false
        }
    })

    const [acquireGoal, setAcquireGoal] = useState(false);
    const [goalPose, setGoalPose] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0,
            valid: false
        }
    })

    const [acquireInit, setAcquireInit] = useState(false);
    const [initialPose, setInitialPose] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0,
            valid: false
        }
    })


    const [clickPose, setClickPose] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0
        }
    })


    const selectInit = () => {
        setAcquireGoal(false);
        setAcquireInit(true);
    }

    const selectGoal = () => {
        setAcquireInit(false);
        setAcquireGoal(true);
    }

    const getCoordinate = (coordinate) => {
        setClickPose({
            lat: coordinate.lat,
            lon: coordinate.lng
        })
        
        return null;
    }

    useEffect(() => {
        /* Get the position of vehicle */
        const getVehiclePose = async () => {
            if(mapScope === 'None') return;
            const response = await axios.get('/map/pose', {});
            let newPose = Object.assign({}, {
                lat: response.data.lat,
                lon: response.data.lon
            })
            console.log(newPose);
            setVehiclePose(newPose)
        }


        /* Get status of vehicle every 1 sec after startup */
        const get_pose_interval = setInterval(getVehiclePose, 1000)

        /* Clear the timer when unmount */
        return () => {
            clearInterval(get_pose_interval)
        }

    }, [mapScope])

    useEffect(() => {
        if (acquireInit && clickPose !== null) {
          // Copy 'click' to 'goal'
          setInitialPose({
            lat: clickPose.lat,
            lon: clickPose.lon,
            valid: true
          });
    
          // Set 'acquire' to false
          setAcquireInit(false);
        }
        else if(acquireGoal && clickPose != null){
            // Copy 'click' to 'goal'
            setGoalPose({
                lat: clickPose.lat,
                lon: clickPose.lon,
                valid: true
            });
        
            // Set 'acquire' to false
            setAcquireGoal(false);
        }
      }, [clickPose]);

    return (
        <>
            <TitleCard title="Map Viewer" TopSideButtons={<Refresh isLoading={refreshLoadinig}/>}>
                <div className="flex gap-4">
                    <MapViewer 
                        classname="w-3/5" 
                        xmlFile="/carla_map/Town01/lanelet2_map.osm" 
                        center={[0.0, 0.0]} 
                        currentMarker={vehiclePose}
                        initMarker={initialPose}
                        goalMarker={goalPose}
                        clickAction={getCoordinate}
                    />
                    <div className="w-2/5 grid grid-row-4">
                        <div className="row-span-1 col-span-1">
                            <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">Select a vehicle</label>
                            <div className="flex">
                                <VehicleSelect state={list} ref={scopeRef} /> 
                                <div className="inline-block w-1/4 p-2">
                                    <VehicleSelectButton text="Select" handleClick={selectVehicle} refon={scopeRef} isLoading={mapLoading} />
                                </div>
                            </div>
                        </div>
                        <div className="row-span-2 col-span-1 grid grid-rows-4 grid-flow-col gap-4">
                            <h6 className="block mb-2 text-2xl font-medium text-gray-900 dark:text-white">Start a new planning</h6>
                            <div className="row-span-1 grid grid-cols-4 gap-4" >
                                <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">Initial Pose</label>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{(initialPose.valid)?(`(${(initialPose.lat).toString().slice(0, 8)}, ${(initialPose.lon).toString().slice(0, 8)})`):("(---, ---)")}</label>
                                <button className="bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case" onClick={() => {selectInit()}}>reselect</button>
                                <button className="btn px-6 btn-sm normal-case btn-info" >set</button>
                            </div>
                            <div className="row-span-1 grid grid-cols-4 gap-4">
                                <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">Goal Pose</label>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{(goalPose.valid)?(`(${(goalPose.lat).toString().slice(0, 8)}, ${(goalPose.lon).toString().slice(0, 8)})`):("(---, ---)")}</label>
                                <button className="bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case"  onClick={() => {selectGoal()}}>reselect</button>
                                <button className="btn px-6 btn-sm normal-case btn-info" >set</button>
                            </div>
                            <div className="row-span-1 col-span-1">
                                <button className="bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case" >Engage</button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </TitleCard>

        </>
    )
}

export default MapPanel