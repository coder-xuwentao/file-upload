//app.js
const http = require('http')
const multiparty = require('multiparty')
const path = require('path')
const fse = require('fs-extra')
const JSZip = require('jszip')

const server = http.createServer()
const UPLOAD_DIR = path.resolve(__dirname, '.', 'chunks') // 读取根目录，创建一个文件夹chunks存放切片
const UNZIP_DIR = path.resolve(__dirname, '.', 'unzip') // 用于展示解压后的文件

server.on('request', async (req, res) => {
    // 处理跨域问题，允许所有的请求头和请求源
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.url === '/upload/can_continue') {
        const { fileName, fileHash, chunkHashs } = await resolvePost(req)
        if (isExistFile(UPLOAD_DIR, `${fileHash}${getExtension(fileName)}`)) { // 已存在file
            res.end(JSON.stringify({ canContinue: false }))
            return
        }
        const chunkDir = getChunkDir(fileHash)
        if (!isExistFile(chunkDir)) { // 不存在chunk文件夹
            res.end(JSON.stringify({ canContinue: false }))
            return
        }
        const chunkPaths = await fse.readdir(chunkDir)
        const existHashs = chunkPaths.map(chunkPath => chunkPath.split('-')[0])
        const isExistHashMatch = existHashs.every(existHash => chunkHashs.includes(existHash))
        if (!isExistHashMatch) { // 本地存在不匹配的chunks
            chunkPaths.forEach(chunkPath => fse.unlinkSync(path.resolve(chunkDir, chunkPath)))
            res.end(JSON.stringify({ canContinue: false }))
            return
        }
        if (chunkPaths.length > 0) { // 服务端存在部分chunk文件，可续传
            res.end(JSON.stringify({
                canContinue: true,
                uploadedHashs: existHashs,
            }))
            return
        }
        res.end(JSON.stringify({ canContinue: false }))
        return
    }

    if (req.url === '/upload/verify') {
        const { fileName, fileHash } = await resolvePost(req)
        if (isExistFile(UPLOAD_DIR, `${fileHash}${getExtension(fileName)}`)) {
            res.end(JSON.stringify({
                shouldUpload: false
            }))
            return
        } else {
            res.end(JSON.stringify({
                shouldUpload: true
            }))
        }
    }

    if (req.url === '/upload') { //前端访问的地址正确
        const multipart = new multiparty.Form() // 解析FormData对象
        multipart.parse(req, async (err, fields, files) => {
            if (err) { //解析失败
                return
            }

            const [file] = files.file
            const [fileHash] = fields.fileHash
            const [chunkName] = fields.chunkName

            const chunkDir = getChunkDir(fileHash) //在chunks文件夹创建一个新的文件夹，存放接收到的所有切片
            if (!fse.existsSync(chunkDir)) { //文件夹不存在，新建该文件夹
                await fse.mkdirs(chunkDir)
            }
            if (isExistFile(chunkDir, chunkName)) {
                res.end(JSON.stringify({
                    code: 0,
                    message: '切片上传成功',
                    isExist: true,
                }))
                return
            }

            // 把切片移动进chunkDir
            await fse.move(file.path, `${chunkDir}/${chunkName}`)
            // await sleep(2000)
            res.end(JSON.stringify({
                code: 0,
                message: '切片上传成功',
                isExist: false,
            }))
        })
    }

    if (req.url === '/upload/merge') { // 该去合并切片了
        const data = await resolvePost(req)
        const {
            fileName,
            fileHash,
            sliceSize
        } = data
        const extension = getExtension(fileName)
        const destinationPath = path.resolve(UPLOAD_DIR, `${fileHash}${extension}`)//获取切片路径
        const chunkDir = getChunkDir(fileHash)
        await mergeFileChunk({ destinationPath, fileHash, sliceSize, chunkDir })
        // unZip有时会失败，为了不阻塞，这里异步
        // 非必要功能，不钻牛角尖
        unZip(destinationPath, fileName)
        res.end(JSON.stringify({
            code: 0,
            message: '文件合并成功'
        }))
    }

    // 合并
    async function mergeFileChunk({ destinationPath, sliceSize, chunkDir }) {
        let chunkPaths = await fse.readdir(chunkDir)
        chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])

        const arr = chunkPaths.map((chunkPath, index) => {
            return pipeStream(
                path.resolve(chunkDir, chunkPath),
                // 在指定的位置创建可写流
                fse.createWriteStream(destinationPath, {
                    start: index * sliceSize,
                    end: (index + 1) * sliceSize
                })
            )
        })
        await Promise.all(arr) //保证所有的切片都被读取
    }

    // 将切片转换成流进行合并
    function pipeStream(path, writeStream) {
        return new Promise(resolve => {
            // 创建可读流，读取所有切片
            const readStream = fse.createReadStream(path)
            readStream.on('end', () => {
                fse.unlinkSync(path) // 读取完毕后，删除已经读取过的切片路径
                resolve()
            })
            readStream.pipe(writeStream) //将可读流流入可写流
        })
    }

    // 解析POST请求传递的参数
    function resolvePost(req) {
        // 解析参数
        return new Promise(resolve => {
            let chunk = ''
            req.on('data', data => { //req接收到了前端的数据
                chunk += data //将接收到的所有参数进行拼接
            })
            req.on('end', () => {
                resolve(JSON.parse(chunk))//将字符串转为JSON对象
            })
        })
    }

    function getExtension(fileName) {
        return '.zip'
        // return fileName.slice(fileName.lastIndexOf("."), fileName.length)
    }

    function isExistFile(filePath, fileName = '') {
        try {
            return fse.existsSync(path.resolve(filePath, fileName))
        } catch (error) {
            return false
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    function getChunkDir(fileHash) {
        return path.resolve(UPLOAD_DIR, `${fileHash}-chunks`)
    }

    async function unZip(filePath, fileName) {
        try {
            const jszip = new JSZip()
            const buffer = await fse.readFile(filePath)
            await jszip.loadAsync(buffer, { base64: true })
            const content = await jszip.files[fileName].async('nodebuffer')

            const dest = path.resolve(UNZIP_DIR, fileName)
            if (!fse.existsSync(UNZIP_DIR)) { //文件夹不存在，新建该文件夹
                await fse.mkdirs(UNZIP_DIR)
            }

            const arrayBuffer = await (content.arrayBuffer?.() || content);
            const buf = Buffer.from(arrayBuffer)
            await fse.writeFile(dest, buf);
        } catch (err) {
            console.warn(err)
        }
    }
})


server.listen(5001, () => {
    console.log('服务已启动');
})