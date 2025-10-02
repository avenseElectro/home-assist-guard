ARG BUILD_FROM
FROM $BUILD_FROM

# Install Python and required packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# Copy application files
COPY run.sh /
COPY src/ /app/

# Make run script executable
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
