const formidable = require('formidable');
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, S3 } = require("@aws-sdk/client-s3");
const Transform = require('stream').Transform;

const parsefile = async (req) => {
    return new Promise((resolve, reject) => {
        let options = {
            maxFileSize: 100 * 1024 * 1024,
            allowEmptyFiles: false
        }

        const form = formidable(options);
        form.parse(req, (err, fields, files) => {
        });

        form.on('error', error => {
            reject(error.message)
        })

        form.on('data', data => {
            if (data.name === "complete") {
                resolve(data.value);
            }
        })

        form.on('fileBegin', (formName, file) => {

            file.open = async function () {
                this._writeStream = new Transform({
                    transform(chunk, encoding, callback) {
                        callback(null, chunk)
                    }
                })

                this._writeStream.on('error', e => {
                    form.emit('error', e)
                });

                // upload to S3
                new Upload({
                    client: new S3Client({
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                        },
                        region: process.env.S3_REGION
                    }),
                    params: {
                        ACL: 'public-read',
                        Bucket: process.env.S3_BUCKET,
                        Key: `${Date.now().toString()}-${this.originalFilename}`,
                        Body: this._writeStream
                    },
                })
                    .done()
                    .then(data => {
                        form.emit('data', { name: "complete", value: data });
                    }).catch((err) => {
                        form.emit('error', err);
                    })
            }

            file.end = function (cb) {
                this._writeStream.on('finish', () => {
                    this.emit('end')
                    cb()
                })
                this._writeStream.end()
            }
        })
    })
}

module.exports = parsefile;