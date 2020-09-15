exports.handler = async (event) => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  return {
    body: `This didn't time out!`
  }
}
