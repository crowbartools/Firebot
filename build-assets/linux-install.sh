#!/bin/sh

sizes="16 24 32 48 64 96 128 256 512"

cd /usr/lib/firebotv5

for size in ${sizes}; do
    xdg-icon-resource install --context mimetypes --size ${size} resources/linux/firebotsetup-icon/${size}x${size}.png application-x-firebotsetup
    # This is a workaround for Ubuntu, where a generic icon in Humanity is used instead of the icon we provide.
    # If the Humanity icon theme is present and has a directory for this size, copy the icon.
    if [ -d /usr/share/icons/Humanity/mimes/${size} ]; then
        cp resources/linux/firebotsetup-icon/${size}x${size}.png /usr/share/icons/Humanity/mimes/${size}/application-x-firebotsetup.png
    fi
done

xdg-mime install resources/linux/firebotsetup-mimetype.xml

# only update the gtk icon cache for Humanity if the Humanity icon theme and gtk-update-icon-cache are available
if [ -x /usr/bin/gtk-update-icon-cache ] && [ -d /usr/share/icons/Humanity ]; then
    gtk-update-icon-cache /usr/share/icons/Humanity &> /dev/null
fi

update-desktop-database &> /dev/null