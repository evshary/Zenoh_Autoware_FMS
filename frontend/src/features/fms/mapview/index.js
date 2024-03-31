import { useEffect, useState, useRef, forwardRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import TitleCard from "../../../components/Cards/TitleCard"
import  MapViewer  from "./mapViewer"
// import { Refresh } from "../vehiclelist"
import { getVehicleList, setVehicleGoal, setEngage } from "./mapViewSlice"
import axios from 'axios'


const RefreshVehicles = (props) => {
    const dispatch = useDispatch()
    if(props.isLoading){
        return (
            <div className="inline-block float-right">
                <button className="btn px-6 btn-sm normal-case btn-primary">
                    <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                    Loading...
                </button>
            </div>
        )
    }
    
    return(
        <div className="inline-block float-right">
            <button className="btn px-6 btn-sm normal-case btn-primary" onClick={() => {dispatch(getVehicleList())}}>Refresh</button>
        </div>
    )
}

const SetGoalBtn = (props) => {
    const dispatch = useDispatch()
    if(props.isLoading){
        return (
            <div className="inline-block float-right">
                <button className="btn px-6 btn-sm normal-case btn-primary">
                    <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                    Loading...
                </button>
            </div>
        )
    }
    // console.log('SetGoalBtn', typeof(props.pose.lat), props.pose.lon)
    return(
        <div className="inline-block float-right">
            {/* <button className="btn px-6 btn-sm normal-case btn-primary" onClick={() => {(props.refon.current.value === 'None')? alert('Please select a vehicle first.') : dispatch(setVehicleGoal(props.refon.current.value, props.pose.lat, props.pose.lon))}}>Set</button> */}
            <button className="btn px-6 btn-sm normal-case btn-primary" onClick={
                () => {
                    (props.refon.current.value === 'None')? alert('Please select a vehicle first.') :
                    dispatch(
                        setVehicleGoal({
                            scope: props.refon.current.value, 
                            lat: props.pose.lat, 
                            lon: props.pose.lon
                        })
                    )
                    props.action({
                        lat: props.pose.lat,
                        lon: props.pose.lon,
                        valid: false
                    })
                }
            }>Set</button>
        </div>
    )
}

const EngageBtn = (props) => {
    const dispatch = useDispatch()
    if(props.isLoading){
        return (
            <div className="inline-block">
                <button className="btn px-6 btn-sm normal-case btn-primary">
                    <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                    Loading...
                </button>
            </div>
        )
    }
    
    return(
        <div className="inline-block">
            <button className="btn px-6 btn-sm normal-case btn-primary" onClick={() => {(props.refon.current.value === 'None')? alert('Please select a vehicle first.') : dispatch(setEngage(props.refon.current.value))}}>Engage</button>
        </div>
    )
}

const VehicleSelect = forwardRef((props, ref) => {
    return (
        <select ref={ref} className={`${props.className} bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}>
            <option value="None">None</option>
            {
                props.state.map((element, idx) => {
                    // var V = JSON.parse(element)
                    return (<option key={element} value={element}>{element}</option>)
                })
            }
        </select>
    )
})


function MapPanel() {
    const list = useSelector(state => state.mapview.list)
    const listLoading = useSelector(state => state.mapview.listIsLoading)
    const setGoalLoading = useSelector(state => state.mapview.setGoalIsLoading)
    const engageLoading = useSelector(state => state.mapview.engageIsLoading)
    const scopeRef = useRef(null);
    const [vehiclePose, setVehiclePose] = useState([])

    const [acquireGoal, setAcquireGoal] = useState(false);
    const [goalPose, setGoalPose] = useState([])

    const [zoomLevel, setZoomLevel] = useState(17)



    const [clickPose, setClickPose] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0
        }
    })

    const [goalCandidate, setGoalCandidate] = useState( () => {
        return {
            lat: 0.0,
            lon: 0.0,
            valid: false
        }
    })


    const toggleSelectGoal = () => {
        setAcquireGoal(prevState => !prevState);
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
            const response = await axios.get('/map/pose', {});
            let newPose = [];
            response.data.forEach(e => {
                newPose.push(
                    Object.assign({}, {
                        scope: e.name,
                        lat: e.lat,
                        lon: e.lon,
                        valid: true
                    })
                )
            });
            
            // console.log(newPose);
            setVehiclePose(newPose)
        }

        const getGoalPose = async () => {
            const response = await axios.get('/map/goalPose', {});
            let newPose = [];
            response.data.forEach(e => {
                newPose.push(
                    Object.assign({}, {
                        scope: e.name,
                        lat: e.lat,
                        lon: e.lon,
                        valid: true
                    })
                )
            });
            
            // console.log(newPose);
            setGoalPose(newPose)
        }



        /* Get current pose of vehicle every 1 sec after startup */
        const get_pose_interval = setInterval(getVehiclePose, 1000)

        /* Get goal pose of vehicle every 1 sec after startup */
        const get_goalPose_interval = setInterval(getGoalPose, 1000)

        /* Clear the timer when unmount */
        return () => {
            clearInterval(get_pose_interval)
            clearInterval(get_goalPose_interval)
        }

    }, [])

    useEffect(() => {
        if(acquireGoal && clickPose != null){
            // Copy 'click' to 'goal'
            setGoalCandidate({
                lat: clickPose.lat,
                lon: clickPose.lon,
                valid: true
            });
        
            // Set 'acquire' to false
            setAcquireGoal(false);
        }
      }, [clickPose]);
    
    const xmlFilePath = process.env.REACT_APP_MAP_FILE_PATH;
    const originX = process.env.REACT_APP_MAP_ORIGIN_LAT;
    const originY = process.env.REACT_APP_MAP_ORIGIN_LON;

    return (
        <>
            <TitleCard title="Map Viewer" TopSideButtons={<RefreshVehicles isLoading={listLoading}/>}>
                <div className="flex gap-4">
                    <MapViewer 
                        classname="w-3/5" 
                        xmlFile={xmlFilePath} 
                        center={[originX, originY]} 
                        currentMarker={vehiclePose}
                        goalMarker={goalPose}
                        setGoalMarker={goalCandidate}
                        clickAction={getCoordinate}
                        zoomLevel={zoomLevel}
                        zoomAction={setZoomLevel}
                    />
                    <div className="w-2/5 grid grid-rows-10 gap-2">
                        <div className="row-span-1">
                            <h6 className="block mb-2 text-2xl font-medium text-gray-900 dark:text-white">Start a new planning</h6>
                        </div>
                        <div className="row-span-4 grid grid-rows-4 gap-4">
                            {/* <div className="row-span-1 grid grid-cols-4 gap-4" >
                                <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">Initial Pose</label>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{(initialPose.valid)?(`(${(initialPose.lat).toString().slice(0, 8)}, ${(initialPose.lon).toString().slice(0, 8)})`):("(---, ---)")}</label>
                                <button className="bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case" onClick={() => {selectInit()}}>reselect</button>
                                <button className="btn px-6 btn-sm normal-case btn-info" >set</button>
                            </div> */}
                            <div className="row-span-1 col-span-1">
                                <div className="flex">
                                    <label className="w-1/3 block mb-2 text-lg font-medium text-gray-900 dark:text-white">Select a vehicle</label>
                                    <VehicleSelect state={list} ref={scopeRef} className="w-2/5"/> 
                                    {/* <div className="inline-block w-1/5 p-2">
                                        <VehicleSelectButton text="Select" handleClick={selectVehicle} refon={scopeRef} isLoading={mapLoading} />
                                    </div> */}
                                </div>
                            </div>
                            <div className="row-span-1 grid grid-cols-5 gap-4">
                                <label className="col-span-1 block mb-2 text-lg font-medium text-gray-900 dark:text-white">Goal Pose</label>
                                <label className="col-span-2 block mb-2 text-lg font-medium text-gray-500 dark:text-white">{(goalCandidate.valid)?(`(${(goalCandidate.lat).toString().slice(0, 8)}, ${(goalCandidate.lon).toString().slice(0, 8)})`):("Reselect and click on map")}</label>
                                <button 
                                    className={
                                        (acquireGoal)?  "col-span-1 bg-blue hover:bg-white-500 text-white-700 btn px-6 btn-sm normal-case" :
                                        "col-span-1 bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case"
                                    }  
                                    onClick={() => {toggleSelectGoal()}}>
                                        {(acquireGoal)?"Cancel":"Select"}
                                </button>
                                <SetGoalBtn isLoading={setGoalLoading} refon={scopeRef} pose={goalCandidate} action={setGoalCandidate} />
                                {/* <button className="col-span-1 btn px-6 btn-sm normal-case btn-info"  onClick={() => {(scopeRef.current === 'None')? alert('Please select a vehicle first.') : dispatch(setVehicleGoal(scopeRef.current, goalPose.lat, goalPose.lon))}}>set</button> */}
                            </div>
                            <div className="row-span-1 col-span-1">
                                <EngageBtn isLoading={engageLoading} refon={scopeRef}/>
                                {/* <button className="bg-transparent hover:bg-blue-500 text-blue-700 btn px-6 btn-sm normal-case" onClick={() => {(scopeRef.current === 'None')? alert('Please select a vehicle first.') : dispatch(setEngage(scopeRef.current))}}>Engage</button> */}
                            </div>
                        </div>
                        <div className="row-span-5"></div>
                    </div>
                    
                </div>
            </TitleCard>

        </>
    )
}

export default MapPanel