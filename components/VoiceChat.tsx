'use client';

import { useState, useEffect } from 'react';
import AgoraRTC, { IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { useAgora } from './AgoraProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, AudioLines } from 'lucide-react';

export default function VoiceChat() {
  const { rtcClient } = useAgora();
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
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
        user.audioTrack?.play();
        setPeerJoined(true);
      }
    };

    const handleUserLeft = () => {
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
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="size-24">
          <AvatarFallback className="bg-muted text-4xl">
            <AudioLines className="size-10 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Badge variant={peerJoined ? 'default' : 'secondary'}>
          {peerJoined ? '음성 연결됨' : '상대방 연결 대기 중...'}
        </Badge>
      </div>

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
    </div>
  );
}
