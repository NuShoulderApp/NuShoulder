
export function Response(success, message, result, code=null) {
	return {
		Response: {
			success,
			message,
			code
		},
		...result
	}
}
