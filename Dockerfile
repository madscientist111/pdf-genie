# A prebuilt headless LibreOffice that has been compiled for Amazon Linux 2
# Reference https://github.com/javidlakha/unofunction/blob/master/base/Dockerfile
FROM --platform=linux/amd64 unofunction/libreoffice as libreoffice

# AWS Lambda Node.js 16.x
FROM public.ecr.aws/lambda/nodejs:16-x86_64

# LibreOffice
COPY --from=libreoffice /opt/libreoffice /opt/libreoffice
COPY --from=libreoffice /usr/lib64 /usr/lib64
ENV LIBREOFFICE_PATH=/opt/libreoffice/program/soffice.bin

# Poppler-Utils pdfcairo
RUN yum install poppler-utils -y

# Fonts
COPY --from=libreoffice /etc/fonts /etc/fonts
COPY --from=libreoffice /usr/include/X11/fonts /usr/include/X11/fonts
COPY --from=libreoffice /usr/share/fonts /usr/share/fonts

# Unofunction
# code
COPY package*.json ./
RUN npm ci && npm cache clean --force

ENV PDF_CAIRO_PATH=/usr/bin

COPY ./ ./

CMD [ "handler.handler" ]