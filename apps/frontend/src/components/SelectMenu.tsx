import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

export type SelectItem<V> = { name: string, value: V };

interface Props<V> {
    label?: string;
    items: SelectItem<V>[];
    setSelected: (value: V) => void;
    selected?: V;
}

export const SelectMenu = <V = string>({ label, items, selected, setSelected }: Props<V>) => {

    const selectedItem = items.find(item => item.value === selected);

    return (
      <Listbox
        value={selectedItem}
        onChange={(newSelectedItem) => setSelected(newSelectedItem.value)}
      >
        {({ open }) => (
          <>
            {label && (
              <Listbox.Label className="block text-sm font-medium text-muted-foreground">
                {label}
              </Listbox.Label>
            )}
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-input bg-background py-2 pl-3 pr-10 text-left text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:text-sm min-w-[10rem]">
                <span className="block truncate text-foreground">
                  {selectedItem?.name ?? "Select one"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-base text-popover-foreground shadow-md focus:outline-hidden sm:text-sm">
                  {items.map((item) => (
                    <Listbox.Option
                      key={item.value as string}
                      className={({ active }) =>
                        clsx(
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={item}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {item.name}
                          </span>

                          {selected ? (
                            <span
                              className={clsx(
                                active ? "text-accent-foreground" : "text-primary",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    );
}
