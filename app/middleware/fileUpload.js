import jwt from "jsonwebtoken";
import env from "../config/env";
import Response from "../libs/response";
import formParser from "../libs/formParser";
import fs from 'fs';
import path from 'path';
import * as _ from 'lodash';
import {
    promisify
} from 'util';


const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);


const fileUploadMiddleware = {


    upload: async (req, res, next) => {

        try {

            let {
                file,
                data
            } = await formParser(req);

            let files = file;

            let getData = data;

            let folderId, folderName, uploadedDirectory;


            if (getData && getData.folder_id) {
                folderId = getData.folder_id;
            } else if (getData && getData.user_id) {
                folderId = getData.user_id;
            }

            if (getData && getData.folder) {
                folderName = getData.folder;
            }

            if (!_.isEmpty(files)) {

                let uploadedDirectory = './public/uploads/' + folderId + '/' + folderName;

                if (!getData.folder_id && !getData.user_id) {
                    uploadedDirectory = './public/uploads/' + folderName;
                }


                let uploadedDirectoryPath = uploadedDirectory.replace(/\/$/, '').split('/');

                for (let i = 1; i <= uploadedDirectoryPath.length; i++) {
                    let segment = uploadedDirectoryPath.slice(0, i).join('/');
                    !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
                }


                if (files.length == 1) {
                    files = files[0];
                    var filename = ''

                    filename = Date.now() + '-' + files.name;



                    let fileRead = await readFile(files.path);

                    fs.writeFile(path.join(uploadedDirectory + '/' + filename), fileRead, function (err) {
                        if (err) throw err;

                        if (req.decrptedBody) {
                            req.decrptedBody = Object.assign(req.decrptedBody, getData);
                            req.decrptedBody.fileResult = {
                                path: uploadedDirectory + '/' + filename,
                                folder: folderName,
                                folder_id: folderId,
                                name: filename,
                                status: true
                            };
                        }

                        if (req.decrptedQuery) {

                            req.decrptedQuery = Object.assign(req.decrptedQuery, getData);

                            req.decrptedQuery.fileResult = {
                                path: uploadedDirectory + '/' + filename,
                                folder: folderName,
                                folder_id: folderId,
                                name: filename,
                                status: true
                            };
                        }
                        //fs.unlink(files.path);
                        next();

                    });


                } else {
                    if (req.decrptedQuery) {
                        req.decrptedQuery.fileResult = [];
                    }

                    if (req.decrptedBody) {
                        req.decrptedBody.fileResult = [];
                    }

                    req.decrptedQuery.fileResult = [];
                    for (let i = 0; i < files.length; i++) {
                        file = files[i];

                        let fileNameObj = file.name.split('*modelKey*');

                        var splitFileName = fileNameObj[0];
                        var filename = Date.now() + '-' + splitFileName;

                        if (fileNameObj[1]) {
                            getData[fileNameObj[1]] = filename;
                        }


                        let fileRead = await readFile(file.path);
                        let addedFile = await fs.writeFile(path.join(uploadedDirectory + '/' + filename), fileRead, function (err) {
                            if (err) throw err;
                        });

                        if (req.decrptedBody) {
                            req.decrptedBody = Object.assign(req.decrptedBody, getData);
                            req.decrptedBody.fileResult.push({
                                path: uploadedDirectory + '/' + filename,
                                folder: folderName,
                                folder_id: folderId,
                                name: filename,
                                status: true
                            });
                        }
                        if (req.decrptedQuery) {

                            req.decrptedQuery = Object.assign(req.decrptedQuery, getData);
                            req.decrptedQuery.fileResult.push({
                                path: uploadedDirectory + '/' + filename,
                                folder: folderName,
                                folder_id: folderId,
                                name: filename,
                                status: true
                            });
                        }
                    }
                    next();
                }


            } else {

                if (req.decrptedBody) {
                    req.decrptedBody = Object.assign(req.decrptedBody, getData);
                }

                if (req.decrptedQuery) {
                    req.decrptedQuery = Object.assign(req.decrptedQuery, getData);
                }


                next();
                //throw 'File not found.';
            }

        } catch (error) {
            res.status(412).json(await Response.errors(error));
        }
    },




};

export default fileUploadMiddleware;