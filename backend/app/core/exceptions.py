"""
Custom exceptions for the API
"""
from fastapi import HTTPException, status


class CredentialsException(HTTPException):
    """Excepción para credenciales inválidas"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class NotFoundException(HTTPException):
    """Excepción para recursos no encontrados"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class ForbiddenException(HTTPException):
    """Excepción para acceso prohibido"""
    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class BadRequestException(HTTPException):
    """Excepción para peticiones inválidas"""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )
