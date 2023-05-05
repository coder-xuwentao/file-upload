import { useRef, useState } from 'react';

import UploadBtn from './components/upload-btn'
import SelectFileBtn from './components/select-file-btn'
import ContinueBtn from './components/continue-btn'

const UploadFile = () => {
    const [data, setData] = useState({
        file: {},
        chunkList: [],
        chunkHashs: [],
        fileHash: '',
        hashToChunkMap: {},
        uploadedHashs: []
    })
    window.data = data // 方便调试
    const updateData = (newData) => {
        setData({ ...data, ...newData })
    }

    const pauseControllerRef = useRef(new AbortController())

    const PauseBtn = () => {
        const handlePause = () => {
            pauseControllerRef.current.abort()
            pauseControllerRef.current = new AbortController()
        }
        return <button onClick={handlePause}>暂停</button>
    }
    
    return (
        <div className="UploadFile">
            <SelectFileBtn updateData={updateData} />
            <UploadBtn pauseController={pauseControllerRef.current} data={data} updateData={updateData}/>
            <PauseBtn />
            <ContinueBtn />
        </div>
    );
}

export default UploadFile;
