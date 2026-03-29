'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { useAgora } from './AgoraProvider';

export default function VoiceChat() {
  const { rtcClient } = useAgora();
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<IRemoteAudioTrack | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);

  useEffect(() => {
    if (!rtcClient) return;

    let audioTrack: IMicrophoneAudioTrack | null = null;

    async function setupAudio() {
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await rtcClient!.publish([audioTrack]);
    }

    const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      await rtcClient!.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        const remoteTrack = user.audioTrack as IRemoteAudioTrack;
        remoteTrack.play();
        setRemoteAudioTrack(remoteTrack);
        setPeerJoined(true);
      }
    };

    const handleUserLeft = () => {
      setRemoteAudioTrack(null);
      setPeerJoined(false);
    };

    rtcClient.on('user-published', handleUserPublished);
    rtcClient.on('user-left', handleUserLeft);

    setupAudio().catch(console.error);

    return () => {
      audioTrack?.close();
      rtcClient.off('user-published', handleUserPublished);
      rtcClient.off('user-left', handleUserLeft);
    };
  }, [rtcClient]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${
          peerJoined ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          🎤
        </div>
        <p className="text-gray-600">
          {peerJoined ? '음성 연결됨' : '상대방 연결 대기 중...'}
        </p>
      </div>

      <button
        onClick={toggleMute}
        className={`px-6 py-3 rounded-full font-semibold transition-all ${
          isMuted
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isMuted ? '🔇 음소거 해제' : '🔊 음소거'}
      </button>
    </div>
  );
}
