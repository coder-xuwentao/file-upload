import { useState } from 'react';
import { calculateHash, createChunk, generateZip } from '../../helper'
import { SLICE_SIZE } from '../../const'

const SelectFileBtn = (props) => {
    const { updateData } = props;
    const [progressValue, setProgressValue] = useState('0')
    const [ziping, setZiping] = useState(false)

    const handleChange = async (e) => {
        const file = e.target.files[0]
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
        updateData({ fileHash, chunkHashs, file, chunkList, hashToChunkMap })
    }
    return (
        <div className='select-file-btn' style={{ paddingBottom: '1rem' }}>
            <input type="file" onChange={handleChange} />
            {ziping
                ? <div className='select-file-btn-zip-tip'>解压中ing</div>
                : <div>
                    <label htmlFor="hash-progress-bar">制作hash进度条：</label>
                    <progress className="hash-progress-bar" value={progressValue} max="100"></progress>
                </div>
            }

        </div>
    )
}

export default SelectFileBtn;