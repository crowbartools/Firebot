import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class KBMRobot {
    public static void main(String[] args) {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

        Robot r = null;
        try {
            r = new Robot();
        } catch (AWTException e1) {
            // TODO Auto-generated catch block
            System.out.print("Failed to create robot.");
            e1.printStackTrace();
            System.exit(1);
        }

        // Make a key string to key id map
        Map<String, Object> map = new HashMap<String, Object>();
        for (Field f : KeyEvent.class.getDeclaredFields()) {
            try {
                if (java.lang.reflect.Modifier.isStatic(f.getModifiers())) {
                    f.setAccessible(true);
                    map.put(f.getName(), f.get(null));
                }
            } catch (Exception ex) {
                //ex.printStackTrace();
                System.out.print("Failed to map key.");
            }
        }

        System.out.print("Starting the loop!!");

        while (true) {
            try {
                String str = in.readLine();

                String[] stringParts = str.split(" ");
                if (stringParts.length > 1) {
                    if (stringParts[0].equalsIgnoreCase("MM") || stringParts[0].equalsIgnoreCase("MOUSEMOVE")) {
                        r.mouseMove(Integer.parseInt(stringParts[1]), Integer.parseInt(stringParts[2]));
                    } else if (stringParts[0].equalsIgnoreCase("MP") || stringParts[0].equalsIgnoreCase("MD")
                            || stringParts[0].equalsIgnoreCase("MOUSEPRESS")) {
                        int press = 0;
                        press |= stringParts[1].indexOf("1") > -1 ? KeyEvent.BUTTON1_MASK : 0;
                        press |= stringParts[1].indexOf("2") > -1 ? KeyEvent.BUTTON2_MASK : 0;
                        press |= stringParts[1].indexOf("3") > -1 ? KeyEvent.BUTTON3_MASK : 0;
                        r.mousePress(press);
                    } else if (stringParts[0].equalsIgnoreCase("MR") || stringParts[0].equalsIgnoreCase("MU")
                            || stringParts[0].equalsIgnoreCase("MOUSERELEASE")) {
                        int press = 0;
                        press |= stringParts[1].indexOf("1") > -1 ? KeyEvent.BUTTON1_MASK : 0;
                        press |= stringParts[1].indexOf("2") > -1 ? KeyEvent.BUTTON2_MASK : 0;
                        press |= stringParts[1].indexOf("3") > -1 ? KeyEvent.BUTTON3_MASK : 0;
                        r.mouseRelease(press);
                    } else if (stringParts[0].equalsIgnoreCase("MW") || stringParts[0].equalsIgnoreCase("MOUSEWHEEL")) {
                        r.mouseWheel(Integer.parseInt(stringParts[1]));
                    } else {
                        Object key = map.get(stringParts[1]);
                        if (key != null) {
                            if (stringParts[0].equalsIgnoreCase("D") || stringParts[0].equalsIgnoreCase("P")
                                    || stringParts[0].equalsIgnoreCase("PRESS")) {
                                System.out.print("Press " + stringParts[1]);
                                r.keyPress((Integer) key);
                            } else if (stringParts[0].equalsIgnoreCase("U") || stringParts[0].equalsIgnoreCase("R")
                                    || stringParts[0].equalsIgnoreCase("RELEASE")) {
                                System.out.print("Release " + stringParts[1]);
                                r.keyRelease((Integer) key);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.out.print("Something bad happened: " + e.toString());
            }
        }
    }
}
