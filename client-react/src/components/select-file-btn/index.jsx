import { useState } from 'react';
import { calculateHash, createChunk, generateZip } from '../../helper'
import { setDataInDB } from '../../helper/indexedDB.js'
import { SLICE_SIZE } from '../../const'
import { ProgressBar } from '../index'

const SelectFileBtn = (props) => {
    const { updateData, onMakingChunk } = props;
    const [progressValue, setProgressValue] = useState('0')
    const [ziping, setZiping] = useState(false)

    const handleChange = async (e) => {
        onMakingChunk(true)
        const file = e.target.files[0]
        if (!file) {
            console.log('没选择文件')
            return
        }
        setZiping(true)
        const fileZip = await generateZip(file)
        setZiping(false)
        const chunkList = createChunk(fileZip, SLICE_SIZE)
        const { fileHash, chunkHashs } = await calculateHash({
            fileChunkList: chunkList,
            onProgress: setProgressValue,
        })

        // 制作hash与chunk的map
        const hashToChunkMap = new Map()
        chunkList.forEach((chunk, index) => {
            hashToChunkMap.set(chunkHashs[index], {
                chunk,
                index
            })
        })
        const data = { fileHash, chunkHashs, fileName: file.name, chunkList, hashToChunkMap }
        updateData(data)
        await setDataInDB(data)
        onMakingChunk(false)
    }
    return (
        <div className='select-file-btn' style={{ paddingBottom: '1rem' }}>
            <input type="file" onChange={handleChange} />
            {ziping
                ? <div className='select-file-btn-zip-tip'>压缩中ing</div>
                : <ProgressBar label={'制作hash进度条：'} value={progressValue} max={100} />
            }
        </div>
    )
}

export default SelectFileBtn;