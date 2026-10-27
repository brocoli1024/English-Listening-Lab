from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
import wave

import av


TRACKS = (
    (
        "twinkle-twinkle-vocal.wav",
        "https://upload.wikimedia.org/wikipedia/commons/4/4f/Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg",
        28,
    ),
    (
        "mary-little-lamb-vocal.wav",
        "https://upload.wikimedia.org/wikipedia/commons/5/50/Mary_Had_a_Little_Lamb.ogg",
        24,
    ),
    (
        "london-bridge-vocal.wav",
        "https://upload.wikimedia.org/wikipedia/commons/2/29/London_Bridge_by_Stephen_Griffith_2013.webm",
        32,
    ),
)

SAMPLE_RATE = 22_050


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "EnglishListeningLab/1.0"})
    with urlopen(request) as response, destination.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def convert(source: Path, destination: Path, maximum_seconds: int) -> None:
    maximum_samples = SAMPLE_RATE * maximum_seconds
    written_samples = 0
    resampler = av.AudioResampler(format="s16", layout="mono", rate=SAMPLE_RATE)

    with av.open(str(source)) as container, wave.open(str(destination), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)

        for frame in container.decode(audio=0):
            for converted in resampler.resample(frame):
                remaining = maximum_samples - written_samples
                if remaining <= 0:
                    return
                sample_count = min(converted.samples, remaining)
                output.writeframes(bytes(converted.planes[0])[: sample_count * 2])
                written_samples += sample_count


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    audio_directory = project_root / "assets" / "audio"
    audio_directory.mkdir(parents=True, exist_ok=True)

    with TemporaryDirectory() as temporary_directory:
        temporary_path = Path(temporary_directory)
        for index, (file_name, url, maximum_seconds) in enumerate(TRACKS):
            source = temporary_path / f"source-{index}"
            download(url, source)
            convert(source, audio_directory / file_name, maximum_seconds)


if __name__ == "__main__":
    main()
