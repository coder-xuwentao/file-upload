import { useEffect, useRef, useState } from 'react';

import { UploadBtn, SelectFileBtn, PauseBtn, ContinueBtn, UploadProgressBar } from './components'
import { initDataFromDB } from './helper/indexedDB'

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

    const [uploadProgress, setUploadProgress] = useState(0)
    const pauseControllerRef = useRef(new AbortController())
    const continueRef = useRef(null)

    useEffect(() => {
        initDataFromDB({
            onLoadData: updateData,
            onConfirmToContinue: () => continueRef.current.click()
        })
    }, [])

    return (
        <div className="UploadFile">
            <SelectFileBtn updateData={updateData} />
            {data.file?.name && <div>已缓存文件：{data.file.name}，可点击上传</div>}
            <UploadBtn
                controllerRef={pauseControllerRef}
                data={data}
                updateData={updateData}
                setUploadProgress={setUploadProgress}
            />
            <PauseBtn controllerRef={pauseControllerRef} />
            <ContinueBtn
                domRef={continueRef}
                data={data}
                controllerRef={pauseControllerRef}
                updateData={updateData}
                setUploadProgress={setUploadProgress}
            />
            <UploadProgressBar max={data.file?.size || 0} value={uploadProgress} />
        </div>
    );
}

export default UploadFile;
