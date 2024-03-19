import { Button, LoadingOverlay, Stack, TextInput, Switch, NativeSelect, NumberInput, Grid, PasswordInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { UserGuide } from "../UserGuide/UserGuide";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import { SaveOutputToTextFile } from "../SaveOutputToFile/SaveOutputToTextFile";

const title = "WPScan";
const description_userguide =
    "WPScan is a tool used for targeting WordPress URL's to allow for the enumeration of any plugins that are installed. " +
    "The tool will further scans these WordPress installations to search for and identify any security issues.\n\nFurther " +
    "information can be found at: https://www.kali.org/tools/wpscan/\n\n" +
    "Using WPScan:\n" +
    "Step 1: Enter a WordPress URL.\n" +
    "       Eg: http://www.wordpress.com/sample\n\n" +
    "Step 2: Click Scan to commence WPScan's operation.\n\n" +
    "Step 3: View the Output block below to view the results of the tools execution.\n\n" +
    "Switch to Advanced Mode for further options.";
const enumerationtypes = ["Vulnerable plugins","All Plugins","Popular Plugins","Vulnerable themes","All themes","Popular themes","Timthumbs","Config Backups","Db exports","UID range","MID range","Custom"]
const enumerationtypesrequiringupdownbound = ["UID range","MID range"];
const detectionmodes = ["mixed","passive","aggressive"];
const outputformats = ["cli-no-colour","cli-no-color","json","cli"]


interface FormValues {
    url: string;
    lowbound: number;
    upbound: number;
    customenum: string;
    verbose: boolean;
    output: string;
    format: string;  
    passwords: string;
    usernames: string;
    stealthy: boolean;
}

const WPScan = () => {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [checkedAdvanced, setCheckedAdvanced] = useState(false);
    const [selectedenumerationtype,setselectedenumerationtype]= useState("");
    const [selecteddetectionmode,setselecteddetectionmode] = useState("");
    const [selectedoutputformat,setselectedoutputformat]= useState("");   
    const [verboseChecked, setVerboseChecked] = useState(false);
    const [stealthyChecked, setStealthyChecked] = useState(false);
    const [pid, setPid] = useState("");

    let form = useForm({
        initialValues: {
            url: "",
            lowbound: 0,
            upbound: 0,
            customenum: "",

            verbose: false,
            output: "",
            format: "",
            stealthy: false,  
            passwords: "",
            usernames: "",
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);

    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);
        },
        [handleProcessData]
    );

    const onSubmit = async (values: FormValues) => {
        setLoading(true);

        const args = [`--url`, values.url];

        //Insantiate enumeration arguments
        if(selectedenumerationtype != "" && checkedAdvanced)
        {
            selectedenumerationtype === "Vulnerable plugins" ? args.push(`-e`,`vp`): undefined;
            selectedenumerationtype === "All Plugins"? args.push(`-e`,`ap`): undefined;
            selectedenumerationtype === "Popular Plugins"? args.push(`-e`, `p`): undefined;
            selectedenumerationtype === "Vulnerable themes"? args.push(`-e`, `vt`): undefined;
            selectedenumerationtype === "All themes" ? args.push(`-e`, `at`):undefined;
            selectedenumerationtype === "Popular themes" ? args.push(`-e`, `t`):undefined;
            selectedenumerationtype === "Timthumbs" ? args.push(`-e`, `tt`): undefined;
            selectedenumerationtype === "Config Backups" ? args.push(`-e`, `cb`): undefined;
            selectedenumerationtype === "Db exports" ? args.push(`-e`, `dbe`): undefined;
            selectedenumerationtype === "UID range" ? args.push(`-e`, `u${values.lowbound}-${values.upbound}`): undefined;
            selectedenumerationtype === "MID range" ? args.push(`-e`, `m${values.lowbound}-${values.upbound}`):undefined;
            selectedenumerationtype === "Custom" ? args.push(`-e`,`${values.customenum}`) : undefined;
        }

        if(selecteddetectionmode)
        {
            args.push(`detection-mode`,`${selecteddetectionmode}`)
        }

        if (verboseChecked) {
            args.push(`-v`);
        }

        if(selectedoutputformat)
        {
            args.push(`-f`,`${selectedoutputformat}`)
        }
        if (stealthyChecked) {
            args.push(`--stealthy`);
        }
        
        if (values.passwords) {
            args.push(`--passwords`);
        }
        if (values.usernames) {
            args.push(`--usernames`);
        }
        if (values.output) {
            args.push(`-o`);
        }        
        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "wpscan",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput("");
    }, [setOutput]);

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
            {LoadingOverlayAndCancelButton(loading, pid)}
            <Stack>
                {UserGuide(title, description_userguide)}
                <TextInput
                    label={"URL of target wordpress site"}
                    placeholder={"Example: http://www.wordpress.com/sample"}
                    required
                    {...form.getInputProps("url")}
                />
                <Switch
                    size="md"
                    label="Advanced Mode"
                    checked={checkedAdvanced}
                    onChange={(e) => setCheckedAdvanced(e.currentTarget.checked)}
                />
                {checkedAdvanced && (
                    <>
                        <NativeSelect
                            value={selectedenumerationtype}
                            onChange={(e) => setselectedenumerationtype(e.target.value)}
                            title={"Enumeration Options"}
                            data={enumerationtypes}
                            placeholder={"Types"}
                            description={"Please select an enumeration type"}
                        />
                        {enumerationtypesrequiringupdownbound.includes(selectedenumerationtype)&&(
                            <>
                                <Grid>
                                    <Grid.Col span={6}>
                                    <NumberInput label ={"Lower Range"} placeholder={"e.g. 1"} {...form.getInputProps("lowbound")}/>
                                    </Grid.Col>

                                    <Grid.Col span={6}>
                                    <NumberInput label ={"Upper Range"} placeholder={"e.g. 5"} {...form.getInputProps("upbound")}/>
                                    </Grid.Col>
                                </Grid>
                            </>                               
                        )}
                        {selectedenumerationtype === "Custom" &&(
                            <TextInput label ={"Custom Enumeration"} placeholder= {"e.g. vp ap u1-5"}{...form.getInputProps("customenum")}/>
                        )}
                        <NativeSelect
                            value={selecteddetectionmode}
                            onChange={(e) => setselecteddetectionmode(e.target.value)}
                            title={"Detectionmode"}
                            data={detectionmodes}
                            placeholder={"Detection Modes"}
                            description={"Please select a detection type"}
                        />
                        <Switch
                            size="md"
                            label="Verbose"
                            checked={verboseChecked}
                            onChange={(e) => setVerboseChecked(e.currentTarget.checked)}
                        />
                        <TextInput label={"Ouput to file"} placeholder={"File Name"}{...form.getInputProps("output")}/>
                        <NativeSelect
                            value={selectedoutputformat}
                            onChange={(e)=> setselectedoutputformat(e.target.value)}
                            title={"Output Format"}
                            data={outputformats}
                            placeholder={"Output Format"}
                            description={"Please select an output format"}
                        />
                        <TextInput label={" List of passwords to use during the password attack."} placeholder={""}{...form.getInputProps("passwords")}/>
                        <TextInput label={"List of usernames to use during the password attack."} placeholder={""}{...form.getInputProps("usernames")}/>
                        <Switch
                            size="md"
                            label="Stealthy"
                            checked={stealthyChecked}
                            onChange={(e) => setStealthyChecked(e.currentTarget.checked)}
                        />
                    </>
                )}
                <Button type={"submit"}>Scan</Button>
                {SaveOutputToTextFile(output)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
};

export default WPScan;
