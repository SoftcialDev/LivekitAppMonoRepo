declare module "qs" {
  /**
   * Serializes an object into a URL query string.
   *
   * @param obj - Object to serialize.
   * @returns Query string representation of the object.
   */
  export function stringify(obj: any): string;

  /**
   * Parses a query string into an object.
   *
   * @param str - Query string to parse.
   * @returns Object representation of the parsed string.
   */
  export function parse(str: string): any;
}
