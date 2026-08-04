from io import BytesIO

from fastapi import HTTPException, UploadFile
from openai import APIConnectionError, APIStatusError, AuthenticationError, BadRequestError, OpenAI, PermissionDeniedError, RateLimitError

from app.config import get_settings


class TranscriptionService:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.model = settings.openai_transcription_model

    async def transcribe(self, audio: UploadFile) -> str:
        if self.client is None:
            raise HTTPException(status_code=503, detail="OpenAI API key is not configured.")

        contents = await audio.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Audio file is empty.")
        if len(contents) < 512:
            raise HTTPException(status_code=400, detail="Recording is too short. Try recording for a few seconds.")

        audio_file = BytesIO(contents)
        audio_file.name = audio.filename or "check-in.webm"
        try:
            result = self.client.audio.transcriptions.create(
                model=self.model,
                file=audio_file,
                response_format="json",
            )
        except AuthenticationError as exc:
            raise HTTPException(status_code=401, detail="OpenAI API key was rejected. Check or rotate the backend key.") from exc
        except PermissionDeniedError as exc:
            raise HTTPException(status_code=403, detail="OpenAI project does not have access to audio transcription.") from exc
        except RateLimitError as exc:
            raise HTTPException(status_code=429, detail="OpenAI transcription limit reached. Try again shortly.") from exc
        except BadRequestError as exc:
            raise HTTPException(status_code=400, detail="OpenAI could not read this audio. Try a shorter recording and speak clearly.") from exc
        except APIConnectionError as exc:
            raise HTTPException(status_code=502, detail="Could not reach OpenAI transcription service.") from exc
        except APIStatusError as exc:
            raise HTTPException(status_code=502, detail="OpenAI transcription service returned an error.") from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Voice transcription failed.") from exc

        transcript = getattr(result, "text", "")
        if not transcript:
            raise HTTPException(status_code=502, detail="OpenAI returned an empty transcript. Try recording again.")
        return transcript
