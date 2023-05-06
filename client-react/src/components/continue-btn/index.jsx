import { SLICE_SIZE } from '../../const'
import { noticeMerge, uploadChunks } from '../../request'

const ContinueBtn = (props) => {
    const { controllerRef, data, updateData, domRef } = props
    const handleClickUpload = async () => {
        const { file, hashToChunkMap, chunkHashs, fileHash, uploadedHashs } = data

        // todo：应该再后端确认下
        // 过滤掉已经上传的chunk
        const restHashs = chunkHashs.filter(chunkHash => !uploadedHashs.includes(chunkHash))
        controllerRef.current = new AbortController()
        await uploadChunks({
            hashToChunkMap,
            chunkHashs: restHashs,
            fileHash,
            onComplete: (uploadedHashs) => updateData({ ...data.uploadedHashs, uploadedHashs }),
            signal: controllerRef.current.signal
        })
        //当所有切片上传成功之后，通知后端合并
        await noticeMerge(file.name, fileHash, SLICE_SIZE)
        alert('上传成功')
    }

    return <button className="continue-btn" ref={domRef} onClick={handleClickUpload}>继续</button>
}
export default ContinueBtn;