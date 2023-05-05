import { useState } from 'react';
import { calculateHash, createChunk, generateZip } from '../helper'
import { SLICE_SIZE } from '../const'

const SelectFileBtn = (props) => {
    const { updateData } = props;
    const [progressValue, setProgressValue] = useState('0')

    const handleChange = async (e) => {
        const file = e.target.files[0]
        const fileZip = await generateZip(file)
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
        updateData({ fileHash, chunkHashs, file, chunkList, hashToChunkMap })
    }
    return (
        <div className='select-file-btn'>
            <input type="file" id="input" onChange={handleChange} />
            <br />
            <label htmlFor="hash-progress-bar">制作hash进度条：</label>
            <progress id="hash-progress-bar" value={progressValue} max="100"></progress>
        </div>
    )
}

export default SelectFileBtn;