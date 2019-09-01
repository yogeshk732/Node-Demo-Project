const MSG_OOPS = "OOPS! some error occured.";
const MSG_COULD_NOT =
  "We couldn't proceed with your request. Please try again later.";
const MSG_MANDATORY = "Mandatory parameters are missing.";
const MSG_DATABASE = "Database Internal Error.";
const MSG_OBJECT_ID = "Invalid/Missing ObjectId.";
const MSG_FORMIDIABLE = "There is some error occured while parsing form data.";
const MSG_TRANSIT_DECRYPT = "Error while decrpting the request";

export default {
  /**to pull the error messages throw by mongo indexes
   * like unique,reuired etc
   */
  pull: err => {
    let errs = [];

    if (typeof err === "string") errs.push(err);

    if (err && err.errors) {
      for (let e in err.errors) {
        errs.push(err.errors[e].message);
      }
    }

    if (errs.length === 0) {
      errs.push(MSG_COULD_NOT);
    }
    return errs;
  },
  oops: (err = MSG_OOPS) => {
    return err;
  },
  internalServer: (err = MSG_COULD_NOT) => {
    return {
      code: 500,
      message: MSG_COULD_NOT,
      err
    };
  },

  mandatory: (err = MSG_MANDATORY) => {
    return { code: 422, message: MSG_MANDATORY, err };
  },
  database: (err = MSG_DATABASE) => {
    return { code: 500, message: MSG_DATABASE, err };
  },
  objectID: (err = MSG_OBJECT_ID) => {
    return {
      code: 422,
      message: MSG_OBJECT_ID,
      err
    };
  },
  formidable: (err = MSG_FORMIDIABLE) => {
    return { code: 500, message: MSG_FORMIDIABLE, err };
  },
  default: (message = MSG_OOPS, code = 412, err = MSG_OOPS) => {
    return { message, code, err };
  },
  transitDecrypt: (err = MSG_TRANSIT_DECRYPT) => {
    return {
      err: { err, description: MSG_TRANSIT_DECRYPT },
      code: 412,
      message: MSG_COULD_NOT
    };
  }
};
