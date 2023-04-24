//app.js
const http = require('http')
const multiparty = require('multiparty')// 中间件，处理FormData对象的中间件
const path = require('path')
const fse = require('fs-extra')//文件处理模块

const server = http.createServer()
const UPLOAD_DIR = path.resolve(__dirname, '.', 'chunks') // 读取根目录，创建一个文件夹chunks存放切片

server.on('request', async (req, res) => {
    // 处理跨域问题，允许所有的请求头和请求源
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')

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

            const chunkDir = path.resolve(UPLOAD_DIR, `${fileHash}-chunks`)//在chunks文件夹创建一个新的文件夹，存放接收到的所有切片
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
            await sleep(2000)
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
            size
        } = data
        const extension = getExtension(fileName)
        const destinationPath = path.resolve(UPLOAD_DIR, `${fileHash}${extension}`)//获取切片路径
        await mergeFileChunk({ destinationPath, fileHash, size })
        res.end(JSON.stringify({
            code: 0,
            message: '文件合并成功'
        }))
    }

    // 合并
    async function mergeFileChunk({ destinationPath, fileHash, size }) {
        const chunkDir = path.resolve(UPLOAD_DIR, `${fileHash}-chunks`)

        let chunkPaths = await fse.readdir(chunkDir)
        chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])

        const arr = chunkPaths.map((chunkPath, index) => {
            return pipeStream(
                path.resolve(chunkDir, chunkPath),
                // 在指定的位置创建可写流
                fse.createWriteStream(destinationPath, {
                    start: index * size,
                    end: (index + 1) * size
                })
            )
        })
        await Promise.all(arr)//保证所有的切片都被读取
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
        return fileName.slice(fileName.lastIndexOf("."), fileName.length)
    }

    function isExistFile(filePath, fileName) {
        return fse.existsSync(path.resolve(filePath, fileName))
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
})


server.listen(3000, () => {
    console.log('服务已启动');
})