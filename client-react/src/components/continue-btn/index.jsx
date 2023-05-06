import { getCanContinue } from '../../request'
import { uploadChunks } from '../../helper'

const ContinueBtn = (props) => {
    const { controllerRef, dataRef, domRef, setProgressValue } = props
    const handleClickUpload = async () => {
        const { fileName, hashToChunkMap, chunkHashs, fileHash } = dataRef.current
        
        const { canContinue, uploadedHashs } = await getCanContinue({ fileName, fileHash, chunkHashs })
        if (!canContinue) {
            return
        }

        // 过滤掉已经上传的chunk
        const restHashs = chunkHashs.filter(chunkHash => !uploadedHashs.includes(chunkHash))
        setProgressValue(uploadedHashs.length)
        
        await uploadChunks({
            hashToChunkMap,
            chunkHashs: restHashs,
            fileHash,
            controllerRef,
            onOneChunkUploaded: () => setProgressValue(value => value + 1),
            onQuickUploaded: () => {
                setProgressValue(chunkHashs.length)
            },
        })
    }

    return <button className="continue-btn" ref={domRef} onClick={handleClickUpload}>继续</button>
}
export default ContinueBtn;