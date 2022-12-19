export const nextTick = (callback: Function): void => {
  new Promise(resolve => resolve(true)).then(() => callback())
}

export const pathJoin = (...pathes: (string | undefined | null)[]): string => {
  if (!pathes.length) return ''

  if (pathes.length === 1) return pathes[0]!

  const rest = pathes
    .slice(1)
    .filter(Boolean)
    .map(path => {
      return path!
        .replace(/\/+/, '/')
        .split('/')
        .filter(Boolean)
        .join('/')
    })
    .join('/')

  return pathes[0]! + (pathes[0]?.endsWith('/') ? '' : '/') + rest
}