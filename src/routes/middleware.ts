import Joi from 'joi';

/**
 *
 * Checks if body is valid. Throws error when it doesn't.
 *
 * @param validationSchema - Joi validation schema object.
 *
 */
export const ValidationMiddleware = (
    validationSchema: Joi.ObjectSchema,
): ((body: unknown) => unknown) => {
    return (body) => {
        if (!body) {
            const error = new Error('no body provided');
            error.name = 'ValidationError';
            throw error;
        }

        const result = Joi.validate(body, validationSchema);
        if (result.error != null) {
            throw result.error;
        }
    };
};

import { NextFunction, Request, Response } from 'express';

export const ErrorMiddleware = (
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    response.status(200).send({
        error: {
            name: error.name,
            message: error.message,
        },
    });
};
