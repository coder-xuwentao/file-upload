import { useEffect, useRef, useState } from 'react';

import { UploadBtn, SelectFileBtn, PauseBtn, ContinueBtn, ProgressBar } from './components'
import { initDataFromDB } from './helper/indexedDB'

const UploadFile = () => {
    const [fileName, setFileName] = useState('')
    const [progressValue, setProgressValue] = useState(0)
    const [progressMax, setProgressMax] = useState(0)
    const [isMakingChunk, setIsMakingChunk] = useState(false)

    const dataRef = useRef({
        fileName: {},
        chunkHashs: [],
        fileHash: '',
        hashToChunkMap: {},
    })
    const updateData = (newData) => {
        if (newData.chunkHashs) {
            setProgressMax(newData.chunkHashs.length)
        }
        if (newData.fileName) {
            setFileName(newData.fileName)
        }
        dataRef.current = { ...dataRef.current, ...newData }
    }

    const pauseControllerRef = useRef(new AbortController())
    const continueRef = useRef(null)

    useEffect(() => {
        initDataFromDB({
            onLoadData: updateData,
            controllerRef: pauseControllerRef,
            setProgressValue
        })
    }, [])

    return (
        <div className="UploadFile">
            <SelectFileBtn updateData={updateData} onMakingChunk={setIsMakingChunk} />

            {!isMakingChunk && fileName.length > 0 && <>
                <div>已缓存文件：{fileName}，可点击上传</div>
                <UploadBtn
                    controllerRef={pauseControllerRef}
                    dataRef={dataRef}
                    updateData={updateData}
                    setProgressValue={setProgressValue}
                />
                <ProgressBar max={progressMax} value={progressValue} label={'上传进度条：'} />
                <PauseBtn controllerRef={pauseControllerRef} />
                <ContinueBtn
                    domRef={continueRef}
                    dataRef={dataRef}
                    controllerRef={pauseControllerRef}
                    updateData={updateData}
                    setProgressValue={setProgressValue}
                />
            </>}
        </div>
    );
}

export default UploadFile;
