'use strict';
import config from '../config/env';
const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);




class Sms {
	constructor() {

	}

	async send(data) {

		return new Promise((resolve, reject) => {


			client.messages.create({
					to: data.to,
					from: config.twilio.from,
					body: data.body,
					mediaUrl: data.link,
				},
				(err, message) => {

					console.log('message err', err);
					console.log('message success', message);
					if (err) {
						reject(err);
					} else {
						resolve(message);
					}
				}
			);
		});

	}

	async isValid(number) {
		console.log('reqObj.phone', number);

		return new Promise((resolve, reject) => {

			client.lookups.phoneNumbers(number)
				.fetch({
					type: 'carrier'
				})
				.then(resp => {
					if (resp && resp.carrier) {
						resolve({
							code: 200,
							status: true,
							message: 'Phone number is valid.',
							data: resp.carrier
						});

					} else {
						reject({
							code: 412,
							status: false,
							message: 'Phone number is not valid.',
							data: resp.carrier
						});
					}

				}).catch(resp => {
					reject({
						code: 412,
						status: false,
						message: 'Phone number is not valid.'
					});
				});

		});

	}


}

export default new Sms();