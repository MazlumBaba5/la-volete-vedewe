export function isChatOpenForTesting() {
  return process.env.NEXT_PUBLIC_CHAT_OPEN_FOR_TESTING === 'true'
}

export function getChatAccessMessage() {
  return isChatOpenForTesting()
    ? 'Chat is open to all registered client and advisor accounts while testing is active.'
    : 'Chat is currently reserved for Gold clients and Premium or Diamond advisors.'
}
