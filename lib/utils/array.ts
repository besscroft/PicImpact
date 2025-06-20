/**
 * 过滤数组中的空字符串
 * @param arr 数组
 */
export const filterStringArray = (arr: string[]): string[] => {
  // 确保输入是数组，如果不是，则返回空数组
  if (!Array.isArray(arr)) {
    return []
  }
  // 过滤掉非字符串元素和空字符串（包括只含空白字符的字符串）
  return arr.filter((item): item is string => item.trim() !== '')
}