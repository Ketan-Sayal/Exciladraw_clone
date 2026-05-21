import JoinRoomPage from '@/components/JoinRoomPage'
import { getToken } from '@/lib/utils'
import React from 'react'

const JoinRoom = async() => {
  const token = await getToken();
  return (
    <JoinRoomPage token={token || ""}/>
  )
}

export default JoinRoom
