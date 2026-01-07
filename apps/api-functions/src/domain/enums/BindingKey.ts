/**
 * @fileoverview BindingKey - Enum for validation binding keys
 * @description Defines the keys used to store validated data in context bindings
 */

/**
 * Keys used to store validated data in Azure Functions context bindings
 */
export enum BindingKey {
  VALIDATED_BODY = 'validatedBody',
  VALIDATED_QUERY = 'validatedQuery',
  VALIDATED_PARAMS = 'validatedParams'
}

