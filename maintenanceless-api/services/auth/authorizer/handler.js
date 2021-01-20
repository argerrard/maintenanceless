export const main = async (event, context) => {
  console.log(event);
  console.log(context);
  return {
    body: {
      result: "Authorized"
    }
  };
};
