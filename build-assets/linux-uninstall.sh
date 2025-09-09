#!/bin/sh

icons="16 24 32 48 64 96 128 256 512"

cd /usr/lib/firebotv5

for icon in ${icons}; do
    xdg-icon-resource uninstall --context mimetypes --size ${icon} application-x-firebotsetup
    # This is a workaround for Ubuntu, where a generic icon in Humanity is used instead of the icon we provide.
    # If the Humanity icon theme is present and has a directory for this size, remove the icon.
    if [ -f /usr/share/icons/Humanity/mimes/${icon}/application-x-firebotsetup.png ]; then
        rm /usr/share/icons/Humanity/mimes/${icon}/application-x-firebotsetup.png
    fi
done

xdg-mime uninstall resources/linux/firebotsetup-mimetype.xml

# only update the gtk icon cache for Humanity if the Humanity icon theme and gtk-update-icon-cache are available
if [ -x /usr/bin/gtk-update-icon-cache ] && [ -d /usr/share/icons/Humanity ]; then
    gtk-update-icon-cache /usr/share/icons/Humanity &> /dev/null
fi

update-desktop-database &> /dev/null