type AvatarProps = {
  avatar?: string
  name?: string
  className?: string
}

const legacyTones: Record<string, string> = {
  'preset:focus': 'bg-violet-500 text-white',
  'preset:bloom': 'bg-emerald-500 text-white',
  'preset:spark': 'bg-rose-500 text-white',
  'preset:calm': 'bg-sky-500 text-white',
  'preset:vision': 'bg-indigo-500 text-white',
  'preset:momentum': 'bg-amber-500 text-white',
}

const Avatar = ({ avatar, name = 'Guest', className = 'h-10 w-10' }: AvatarProps) => {
  const isImage = avatar?.startsWith('https://') || avatar?.startsWith('/avatars/')
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-rose-100 font-black text-rose-700 ${avatar ? legacyTones[avatar] || '' : ''} ${className}`} aria-label={`${name} avatar`}>
      {isImage ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export default Avatar
