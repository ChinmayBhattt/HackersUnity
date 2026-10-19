'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react'
import { loadAvatarRuntime, type RuntimeAvatar } from './avatar-runtime'
import { avatarData, type AnimationName } from './unknown.avatar'

export type { AnimationName } from './unknown.avatar'
export type AvatarHandle = {
  play: (animation?: AnimationName) => void
  pause: () => void
  stop: () => void
}
export type AvatarProps = {
  animation?: AnimationName
  playing?: boolean
  loop?: boolean
  size?: number | string
  className?: string
  style?: CSSProperties
  onAnimationEnd?: (animation: AnimationName) => void
}

export const Unknown = forwardRef<AvatarHandle, AvatarProps>(function Unknown(
  {
    animation = "sleeping",
    playing = true,
    loop,
    size = 240,
    className,
    style,
    onAnimationEnd,
  },
  ref
) {
  const host = useRef<HTMLSpanElement>(null)
  const controller = useRef<RuntimeAvatar<AnimationName> | null>(null)
  const animationRef = useRef(animation)
  const playingRef = useRef(playing)
  const onAnimationEndRef = useRef(onAnimationEnd)
  animationRef.current = animation
  playingRef.current = playing
  onAnimationEndRef.current = onAnimationEnd

  useEffect(() => {
    if (!host.current) return
    let disposed = false
    let avatar: RuntimeAvatar<AnimationName> | null = null
    void loadAvatarRuntime<AnimationName>(avatarData).then(runtime => {
      if (disposed || !host.current) return
      avatar = runtime.createAvatar(host.current, {
        animation: animationRef.current,
        autoplay: playingRef.current,
        loop,
        size: '100%',
        onAnimationEnd: next => onAnimationEndRef.current?.(next),
      })
      controller.current = avatar
    })
    return () => {
      disposed = true
      avatar?.destroy()
      controller.current = null
    }
  }, [loop])

  useEffect(() => {
    const avatar = controller.current
    if (!avatar) return
    if (playing) avatar.play(animation)
    else avatar.pause()
  }, [animation, playing])

  useImperativeHandle(ref, () => ({
    play(next = animation) { controller.current?.play(next) },
    pause() { controller.current?.pause() },
    stop() { controller.current?.stop() },
  }), [animation])

  const dimension = typeof size === 'number' ? size + 'px' : size
  return (
    <span
      ref={host}
      className={className}
      style={{ display: 'inline-block', width: dimension, height: dimension, position: 'relative', overflow: 'visible', ...style }}
    >
      <svg
        viewBox="-150 -150 300 300"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label="HUe Avatar"
      >
        <defs>
          <radialGradient id="hueFallbackBody" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4de5ff" />
            <stop offset="55%" stopColor="#00c7fc" />
            <stop offset="100%" stopColor="#008cb6" />
          </radialGradient>
          <radialGradient id="hueFallbackEar" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#66e9ff" />
            <stop offset="55%" stopColor="#00c7fc" />
            <stop offset="100%" stopColor="#007d9e" />
          </radialGradient>
          <linearGradient id="hueFallbackEye" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff8533" />
            <stop offset="100%" stopColor="#ff5500" />
          </linearGradient>
        </defs>
        <circle cx="-68" cy="-58" r="38" fill="url(#hueFallbackEar)" />
        <circle cx="0" cy="0" r="120" fill="url(#hueFallbackBody)" />
        <rect x="-38" y="-12" width="22" height="50" rx="11" fill="url(#hueFallbackEye)" transform="rotate(-6 -27 13)" />
        <rect x="16" y="-12" width="22" height="50" rx="11" fill="url(#hueFallbackEye)" transform="rotate(6 27 13)" />
        <circle cx="-29" cy="-2" r="4" fill="#ffffff" opacity="0.9" />
        <circle cx="25" cy="-2" r="4" fill="#ffffff" opacity="0.9" />
      </svg>
    </span>
  )
})

export default Unknown
