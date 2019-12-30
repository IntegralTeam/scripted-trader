import { NextFunction, Request, Response } from 'express';

/**
 *
 * Wraps a router function passing a body to it and sending result back.
 *
 * @param wrappedFunction - function that accepts a body and returns a response both in JSON format
 * @param mappedParams - route parameters that are mapped to the wrappedFunction's body
 *
 * @returns express router function that extracts body from request, sends result back.
 * In case of an error passes it further
 *
 */
export const RouteWrapper = (
    wrappedFunction: (body: unknown) => unknown,
    mappedParams: string[] = [],
): ((request: Request, response: Response, next: NextFunction) => unknown) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await wrappedFunction({
                ...request.body,
                ...mappedParams.reduce<Record<string, unknown>>((previousValue, currentValue) => {
                    previousValue[currentValue] = request.params[currentValue];
                    return previousValue;
                }, {}),
            });
            const responseBody: {
                result: unknown;
            } = {
                result: { success: true },
            };

            if (result) {
                responseBody.result = result;
            }

            response.send(responseBody);
        } catch (error) {
            next(error);
        }
    };
};

/**
 *
 * Wraps any function acting as an express middleware passing a body to it and handling resulting errors.
 *
 * @param wrappedFunction - function that accepts a body in JSON format.
 *
 * @returns express middleware function that extracts body form request, sends it to wrappedFunction and handles errors.
 *
 */
export const MiddlewareWrapper = (
    wrappedFunction: (body: unknown) => unknown,
): ((request: Request, response: Response, next: NextFunction) => unknown) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            await wrappedFunction(request.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};
