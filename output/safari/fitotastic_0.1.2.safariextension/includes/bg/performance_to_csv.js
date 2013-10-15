//generate csv file from data
//Activity, Date (YYYYMMDD), Set, Weight, Unit, Reps, Unit, Combined, Points
function generate_csv(data) {
    //initialize variables
    var csv = [];
    var column_titles = {"action": "\"Activity\"", "date" : "\"Date (YYYYMMDD)\"", "string": "\"Combined\"", "points": "\"Points\""};
    var effort_columns = ["effort0", "effort1", "effort2", "effort3", "effort4", "effort5"];
    for (var e = 0; e < effort_columns.length; e++)
        column_titles[effort_columns[e]] = "";

    for (var w = 0; w < data.length; w++) {
        var wo = data[w];
        for (var s = 0; s < wo.actions.length; s++) {
            var set = wo.actions[s];
            var row = [];
            //see if column title is set
            if (!column_titles.set && set.action.set_name)
                column_titles.set = "\"" + set.action.set_name + "\"";
            //write actvity name
            row.push("\"" + set.action.name + "\"");
            //write date
            row.push(wo.date);
            //write set
            row.push(parseInt(set.subgroup_order) + 1);

            for (e = 0; e < effort_columns.length; e++) {
                var ef = effort_columns[e];

                //see if column title is set
                if (!column_titles[ef] && set[ef+"_label"])
                    column_titles[ef] = "\"" + set[ef+"_label"] + "\"";

                //effort only counts if it has a string
                if (set[ef+"_string"]) {
                    //write value
                    if (set[ef]) row.push(set[ef]);
                    else        row.push("");
                    //write unit
                    if (set[ef+"_unit_abbr"]) row.push("\"" + set[ef+"_unit_abbr"]+"\"");
                    else                     row.push("");
                }
                else{
                    row.push("");
                    row.push("");
                }
            }
            //write combined string
            row.push("\"" + set.string + "\"");
            //write points
            row.push("\"" + set.points + "\"");
            //new line
            csv.push(row);
        }
    }

    //see if any columns are completely blank
    blank_efforts = {"effort0":true,
                     "effort1":true,
                     "effort2":true,
                     "effort3":true,
                     "effort4":true,
                     "effort5":true
                    };
    for (var c = 0; c < csv.length; c++) {
        if (csv[c][3]  || csv[c][4])  blank_efforts.effort0 = false;
        if (csv[c][5]  || csv[c][6])  blank_efforts.effort1 = false;
        if (csv[c][7]  || csv[c][8])  blank_efforts.effort2 = false;
        if (csv[c][9]  || csv[c][10]) blank_efforts.effort3 = false;
        if (csv[c][11] || csv[c][12]) blank_efforts.effort4 = false;
        if (csv[c][13] || csv[c][14]) blank_efforts.effort5 = false;
    }

    //build column titles
    var titles = column_titles.action + "," + column_titles.date + "," + column_titles.set;
    for (e = 0; e < effort_columns.length; e++) {
        if (!blank_efforts[effort_columns[e]])
            titles += "," + column_titles[effort_columns[e]] + ",\"unit\"";
    }
    titles += "," + column_titles.string + "," + column_titles.points + "\n";

    //build csv data string
    var csv_string = "";
    for (c = 0; c < csv.length; c++) {
        csv_string += csv[c][0] + "," + csv[c][1] + "," + csv[c][2];
        if (!blank_efforts.effort0)  csv_string += "," + csv[c][3]  + "," + csv[c][4];
        if (!blank_efforts.effort1)  csv_string += "," + csv[c][5]  + "," + csv[c][6];
        if (!blank_efforts.effort2)  csv_string += "," + csv[c][7]  + "," + csv[c][8];
        if (!blank_efforts.effort3)  csv_string += "," + csv[c][9]  + "," + csv[c][10];
        if (!blank_efforts.effort4)  csv_string += "," + csv[c][11] + "," + csv[c][12];
        if (!blank_efforts.effort5)  csv_string += "," + csv[c][13] + "," + csv[c][14];
        csv_string += "," + csv[c][15] + "," + csv[c][16];
        csv_string += "\n";
    }
    csv_string = titles + csv_string;

    return csv_string;
}