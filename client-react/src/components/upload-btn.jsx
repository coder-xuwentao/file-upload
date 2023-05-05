import { useState } from 'react'

import { noticeMerge, getShouldUpload, uploadChunks } from '../request/fetch-api.js'
import { setDataInDB } from '../helper'
import { SLICE_SIZE } from '../const'

const UploadBtn = (props) => {
    const { pauseController, data, updateData } = props
    const [progressValue, setProgressValue] = useState(0)
    const [progressMax, setProgressMax] = useState(0)

    const handleClickUpload = async () => {
        const { file, fileHash, chunkHashs, hashToChunkMap } = data
        setProgressMax(file.size)
        const shouldUpload = await getShouldUpload(file.name, fileHash)
        if (!shouldUpload) {
            setProgressValue(progressMax)
            alert('秒传成功')
            return
        }
        await setDataInDB(data)
        await uploadChunks({
            hashToChunkMap,
            chunkHashs,
            fileHash,
            onChunkUploaded: (chunkHash) => {
                setProgressValue(progressValue => Number(progressValue) + SLICE_SIZE)
                updateData({ uploadedHashs: [...data.uploadedHashs, chunkHash] })
            },
            signal: pauseController.signal
        })

        //当所有切片上传成功之后，通知后端合并
        await noticeMerge(data.file.name, data.fileHash, SLICE_SIZE)
        setProgressValue(file.size) // 有点误差，暂时hack一下
        alert('上传成功')
    }

    return (
        <div className="upload-btn">
            <button id="upload" onClick={handleClickUpload}>上传</button>
            <label htmlFor="upload-progress-bar">上传进度条：</label>
            <progress id="upload-progress-bar" value={progressValue} max={progressMax} ></progress>
        </div>
    )
}
export default UploadBtn;