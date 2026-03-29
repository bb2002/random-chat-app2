'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { useAgora } from './AgoraProvider';

export default function VideoChat() {
  const { rtcClient } = useAgora();
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rtcClient) return;

    let videoTrack: ICameraVideoTrack | null = null;
    let audioTrack: IMicrophoneAudioTrack | null = null;

    async function setupMedia() {
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      videoTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: 'user', // 모바일: 전면 카메라 기본
      });

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await rtcClient!.publish([audioTrack, videoTrack]);
    }

    const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      await rtcClient!.subscribe(user, mediaType);
      if (mediaType === 'video') {
        const remoteTrack = user.videoTrack as IRemoteVideoTrack;
        if (remoteVideoRef.current) {
          remoteTrack.play(remoteVideoRef.current);
        }
        setPeerJoined(true);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };

    const handleUserLeft = () => {
      setPeerJoined(false);
    };

    rtcClient.on('user-published', handleUserPublished);
    rtcClient.on('user-left', handleUserLeft);

    setupMedia().catch(console.error);

    return () => {
      videoTrack?.close();
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

  const toggleCamera = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        <div className="relative bg-black rounded-xl overflow-hidden min-h-[200px]">
          <div ref={remoteVideoRef} className="w-full h-full" />
          {!peerJoined && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              상대방 연결 대기 중...
            </div>
          )}
        </div>
        <div className="relative bg-gray-900 rounded-xl overflow-hidden min-h-[200px]">
          <div ref={localVideoRef} className="w-full h-full" />
          <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            나
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-4 p-4">
        <button
          onClick={toggleMute}
          className={`px-5 py-3 rounded-full font-semibold transition-all ${
            isMuted
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isMuted ? '🔇 음소거 해제' : '🔊 음소거'}
        </button>
        <button
          onClick={toggleCamera}
          className={`px-5 py-3 rounded-full font-semibold transition-all ${
            isCameraOff
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isCameraOff ? '📷 카메라 켜기' : '📷 카메라 끄기'}
        </button>
      </div>
    </div>
  );
}
