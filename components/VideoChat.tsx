'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { useAgora } from './AgoraProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

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
        facingMode: 'user',
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
    <div className="flex h-full flex-col">
      <div className="grid flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
        {/* Remote video */}
        <div className="relative overflow-hidden rounded-xl bg-muted">
          <div ref={remoteVideoRef} className="size-full" />
          {!peerJoined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">상대방 연결 대기 중...</p>
            </div>
          )}
        </div>

        {/* Local video */}
        <div className="relative overflow-hidden rounded-xl bg-muted/60">
          <div ref={localVideoRef} className="size-full" />
          <Badge variant="secondary" className="absolute bottom-2 left-2">
            나
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 border-t p-4">
        <Button
          variant={isMuted ? 'destructive' : 'outline'}
          size="lg"
          onClick={toggleMute}
        >
          {isMuted ? (
            <MicOff data-icon="inline-start" />
          ) : (
            <Mic data-icon="inline-start" />
          )}
          {isMuted ? '음소거 해제' : '음소거'}
        </Button>
        <Button
          variant={isCameraOff ? 'destructive' : 'outline'}
          size="lg"
          onClick={toggleCamera}
        >
          {isCameraOff ? (
            <VideoOff data-icon="inline-start" />
          ) : (
            <Video data-icon="inline-start" />
          )}
          {isCameraOff ? '카메라 켜기' : '카메라 끄기'}
        </Button>
      </div>
    </div>
  );
}
