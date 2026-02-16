import os

SECRET_KEY = os.environ.get("SECRET_KEY", "NH/a05xVQFOsoEk4uBFrdRVVOJw1hdu9txKRmyCTYrE=")
DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://php_flask:SdeSindrome$@localhost/db_php_flask")
BASE_DIR = "/srv/data"