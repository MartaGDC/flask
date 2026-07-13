import os

SECRET_KEY = os.environ.get("SECRET_KEY", "NH/a05xVQFOsoEk4uBFrdRVVOJw1hdu9txKRmyCTYrE=")
DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://downloads_user:SdeSindrome$@localhost/db_downloads")
BASE_DIR = "/srv/UZSim"