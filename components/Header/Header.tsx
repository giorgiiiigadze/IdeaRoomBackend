import { ThemeToggle } from "../ToggleThemeChange"

export default function Header({triger} : any){
    return (
        <div className="w-full py-2 flex items-center justify-between px-4 border-b">
            {triger}

            Header
            <ThemeToggle />
        </div>
    )
}