// import { useManageProfileSlideOver } from "@/components/header/ManageProfileSlideOver";
// import { useActiveProfile } from "@/hooks/api/use-active-profile";
// import {
//   PencilIcon,
//   ArrowsRightLeftIcon,
//   UsersIcon,
//   ChevronUpIcon,
// } from "@heroicons/react/16/solid";
// import { Avatar } from "../catalyst/avatar";
// import {
//   Dropdown,
//   DropdownButton,
//   DropdownMenu,
//   DropdownItem,
//   DropdownLabel,
//   DropdownDivider,
// } from "../catalyst/dropdown";
// import { SidebarItem } from "../catalyst/sidebar";
// import { useLogins } from "@/hooks/api/use-logins";
// import { useStreamingPlatforms } from "@/hooks/api/use-streaming-platforms";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// export const ProfileDropdownNew: React.FC = () => {
//   const { data: activeProfile } = useActiveProfile();
//   const { data: loginData } = useLogins();
//   const { data: streamingPlatforms } = useStreamingPlatforms();

//   const streamingPlatformsWithLogins = streamingPlatforms.filter((sp) => {
//     if (!sp.icon) return false;
//     const platformLoginData = loginData?.[sp.id];
//     const activeLogin = platformLoginData?.loginConfigs.find(
//       (l) => l.id === platformLoginData.activeLoginConfigId
//     );
//     return activeLogin?.streamer != null;
//   });

//   const loginWithAvatarUrl = Object.values(loginData || {})
//     // filter to platforms with logins
//     .filter((l) => !!l.loginConfigs.length)
//     // map to active streamer login config or first streamer login config
//     .map(
//       (l) =>
//         l.loginConfigs.find((c) => c.id === l.activeLoginConfigId)?.streamer ??
//         l.loginConfigs[0]?.streamer
//     )
//     // find first login config with streamer avatar url
//     .find((c) => !!c?.avatarUrl?.length);

//   const avatarUrl = loginWithAvatarUrl?.avatarUrl ?? "/profile-photo.jpg";

//   const manageProfileSlideOver = useManageProfileSlideOver();

//   return (
//     <>
//       <Dropdown>
//         <DropdownButton as={SidebarItem}>
//           <span className="flex min-w-0 items-center gap-3">
//             <Avatar src={avatarUrl} className="size-10" square alt="" />
//             <span className="min-w-0">
//               <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
//                 {activeProfile?.name}
//               </span>

//               <span className="block truncate text-xs/5 w-5 font-normal text-zinc-500 dark:text-zinc-400">
//                 {streamingPlatformsWithLogins.map((platform) => (
//                   <FontAwesomeIcon
//                     key={platform.id}
//                     className="text-xs mr-2 text-zinc-300"
//                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                     icon={["fab", platform.icon as any]}
//                   />
//                 ))}
//               </span>
//             </span>
//           </span>
//           <ChevronUpIcon />
//         </DropdownButton>
//         <DropdownMenu className="min-w-64" anchor="top start">
//           <DropdownItem className="opacity-50" >
//             <UsersIcon />
//             <DropdownLabel>Manage profiles</DropdownLabel>
//           </DropdownItem>
//           <DropdownItem className="opacity-50">
//             <ArrowsRightLeftIcon />
//             <DropdownLabel>Switch profiles</DropdownLabel>
//           </DropdownItem>
//           <DropdownDivider />
//           <DropdownItem
//             onClick={() => {
//               manageProfileSlideOver.show({
//                 params: {},
//               });
//             }}
//           >
//             <PencilIcon />
//             <DropdownLabel>Edit profile</DropdownLabel>
//           </DropdownItem>
//         </DropdownMenu>
//       </Dropdown>
//     </>
//   );
// };
