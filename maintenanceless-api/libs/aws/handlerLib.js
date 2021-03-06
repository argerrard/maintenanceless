export default function handler(lambda) {
  return async function(event, context) {
    let body, statusCode;

    try {
      // Run the Lambda
      const result = await lambda(event, context);
      body = result.body;
      statusCode = result.statusCode || 200;
    } catch (e) {
      body = { error: "There was a problem fulfilling your request." };
      statusCode = 500;
    }

    // Return HTTP response
    return {
      statusCode,
      body: JSON.stringify(body),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      }
    };
  };
}